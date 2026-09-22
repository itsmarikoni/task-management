resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = [aws_subnet.private_db_1.id, aws_subnet.private_db_2.id]

  tags = {
    Name = "${var.project_name}-db-subnet-group"
  }
}

resource "aws_db_instance" "main" {
  identifier     = "${var.project_name}-db"
  engine         = "postgres"
  engine_version = "16"

  # 無料利用枠の対象インスタンスクラス・ストレージ量
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  storage_type      = "gp2"

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  # EC2からのみ接続させるためインターネットには公開しない
  publicly_accessible = false

  # 検証用途のため、削除時にスナップショットを作らずすぐ消せるようにする
  skip_final_snapshot = true
  # 検証中に誤ってapplyしてもすぐ消せるよう削除保護は無効化
  deletion_protection = false

  tags = {
    Name = "${var.project_name}-db"
  }
}
