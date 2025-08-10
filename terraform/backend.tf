resource "google_storage_bucket" "terraform-backend" {
  name     = "${local.app_name}-terraform-backend"
  project  = local.project_id
  location = local.region

  force_destroy            = false
  public_access_prevention = "enforced"

  uniform_bucket_level_access = true
  versioning {
    enabled = true
  }
}
