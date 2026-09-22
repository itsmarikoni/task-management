output "ec2_public_ip" {
  description = "EC2インスタンスのパブリックIPアドレス"
  value       = aws_instance.app.public_ip
}

output "ssh_command" {
  description = "SSH接続コマンド"
  value       = "ssh -i ~/.ssh/task-mgmt-ec2 ec2-user@${aws_instance.app.public_ip}"
}

output "rds_endpoint" {
  description = "RDSのエンドポイント（EC2内部からのみ到達可能）"
  value       = aws_db_instance.main.endpoint
}
