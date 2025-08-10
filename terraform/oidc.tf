resource "google_iam_workload_identity_pool" "github_actions" {
  workload_identity_pool_id = "github-actions"
}

resource "google_iam_workload_identity_pool_provider" "github" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.github_actions.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-actions"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }

  attribute_condition = "\"${data.github_repository.app.full_name}\" == assertion.repository"
  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
  }
}

resource "google_service_account" "github_actions" {
  account_id   = "github-actions"
  display_name = "Github Actions"
}
resource "google_project_iam_member" "github_actions" {
  project = local.project_id
  role    = "roles/editor"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}
