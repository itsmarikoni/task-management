terraform {
  required_version = ">= 1.7.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  # default プロファイルを使うため profile 指定は不要。
  # 名前付きプロファイルを使う場合はここに profile = "<名前>" を追加する
}
