# TODO: Import state
# resource "kubernetes_namespace" "media" {
#   metadata {
#     name = "media"
#   }
# }

module "sonarr" {
  source    = "../../modules/arr-app"
  namespace = "media"
  image     = "ghcr.io/hotio/sonarr:latest"
  port      = 8989
  vol = {
    "/zssd/general/config/sonarr" = "/config"
    "/data/torrents"              = "/downloads"
    "/data/media/tv"              = "/tv"
    "/data/media/recycle-bin"     = "/recycle-bin"
  }
}

module "radarr" {
  source    = "../../modules/arr-app"
  namespace = "media"
  image     = "ghcr.io/hotio/radarr:latest"
  port      = 7878
  vol = {
    "/zssd/general/config/radarr" = "/config"
    "/data/torrents"              = "/downloads"
    "/data/media/movies"          = "/movies"
    "/data/media/recycle-bin"     = "/recycle-bin"
  }
}
