data "github_repository" "app" {
  full_name = "Mkamono/repo-wise"
}

resource "github_actions_secret" "wif-sa-email" {
  repository      = data.github_repository.app.id
  secret_name     = "WIF_SERVICE_ACCOUNT_EMAIL"
  plaintext_value = google_service_account.github_actions.email
}

resource "github_actions_secret" "wif-provider-id" {
  repository      = data.github_repository.app.id
  secret_name     = "WIF_PROVIDER_ID"
  plaintext_value = google_iam_workload_identity_pool_provider.github.name
}

resource "github_actions_secret" "cloudsql-instance-name" {
  repository      = data.github_repository.app.id
  secret_name     = "WIF_CLOUDSQL_INSTANCE_NAME"
  plaintext_value = google_sql_database_instance.main.id
}
