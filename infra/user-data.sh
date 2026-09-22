#!/bin/bash
set -eux

# Amazon Corretto公式リポジトリを追加してJava 25をインストール
# (backend/build.gradle.kts の languageVersion 指定に合わせる)
rpm --import https://yum.corretto.aws/corretto.key
curl -Lo /etc/yum.repos.d/corretto.repo https://yum.corretto.aws/corretto.repo
dnf install -y java-25-amazon-corretto-devel

# Nginx: リバースプロキシとして導入
# - / 以下(フロントエンドの静的ファイル): /var/www/frontend から配信
# - /api/ 以下: バックエンド(localhost:8080)へ転送
dnf install -y nginx

mkdir -p /var/www/frontend

cat > /etc/nginx/conf.d/task-mgmt.conf <<'NGINX_CONF'
server {
    listen 80;
    server_name _;

    root /var/www/frontend;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX_CONF

systemctl enable nginx
systemctl start nginx

# バックエンド用: jarはあとでデプロイ時に配置する。ここではディレクトリと
# systemdサービス定義のみ用意する（DBパスワード等の機密情報はここに書かない）
mkdir -p /opt/task-mgmt
mkdir -p /etc/task-mgmt
chown ec2-user:ec2-user /opt/task-mgmt

cat > /etc/systemd/system/task-mgmt-backend.service <<'UNIT'
[Unit]
Description=Task Management Backend
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/task-mgmt
EnvironmentFile=/etc/task-mgmt/backend.env
Environment=SPRING_PROFILES_ACTIVE=prod
ExecStart=/usr/bin/java -jar /opt/task-mgmt/app.jar
SuccessExitStatus=143
Restart=on-failure

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable task-mgmt-backend
