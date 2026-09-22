variable "aws_region" {
  description = "リソースを作成するAWSリージョン"
  type        = string
  default     = "ap-northeast-1"
}

variable "project_name" {
  description = "リソース名のプレフィックスとして使うプロジェクト名"
  type        = string
  default     = "task-mgmt"
}

variable "instance_type" {
  description = "EC2インスタンスタイプ"
  type        = string
  default     = "t3.micro"
}

variable "ssh_public_key_path" {
  description = "EC2に登録するSSH公開鍵のローカルパス"
  type        = string
  default     = "~/.ssh/task-mgmt-ec2.pub"
}

variable "my_ip_cidr" {
  description = "SSH接続を許可する自分のIPアドレス（CIDR形式、例: 1.2.3.4/32）。terraform.tfvarsで指定する"
  type        = string
}

variable "db_name" {
  description = "RDSに作成するデータベース名"
  type        = string
  default     = "task_management"
}

variable "db_username" {
  description = "RDSの管理者ユーザー名"
  type        = string
  default     = "task_management"
}

variable "db_password" {
  description = "RDSの管理者パスワード。terraform.tfvarsで指定する（Gitにコミットしない）"
  type        = string
  sensitive   = true
}
