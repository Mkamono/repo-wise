terraform {
  required_version = ">= 1.12"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "6.47.0"
    }
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }
  backend "gcs" {
    bucket = "repo-wise-terraform-backend"
  }
}
