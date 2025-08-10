resource "google_sql_database" "database" {
  name     = "${local.app_name}-db"
  instance = google_sql_database_instance.main.name
}

# See versions at https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/sql_database_instance#database_version
resource "google_sql_database_instance" "main" {
  name             = "${local.app_name}-instance"
  region           = local.region
  database_version = "POSTGRES_17"
  settings {
    tier      = "db-f1-micro"
    edition   = "ENTERPRISE"
    disk_type = "PD_HDD"
    disk_size = 10
  }

  deletion_protection = false
}
