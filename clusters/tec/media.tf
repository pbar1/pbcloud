resource "kubernetes_namespace" "media" {
  metadata {
    name = "test"
  }
}

module "sonarr" {
  source    = "../../modules/arr-app"
  namespace = kubernetes_namespace.media.metadata[0].name
  image     = "ghcr.io/hotio/sonarr:latest"
  port      = 8989
}
