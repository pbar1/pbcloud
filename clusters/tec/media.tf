# TODO: Import state
# resource "kubernetes_namespace" "media" {
#   metadata {
#     name = "media"
#   }
# }

module "prowlarr" {
  source    = "../../modules/arr-app"
  namespace = "media"
  image     = "ghcr.io/hotio/prowlarr:latest"
  port      = 9696
  vol = {
    "/zssd/general/config/prowlarr" = "/config"
  }
}

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

module "readarr" {
  source    = "../../modules/arr-app"
  namespace = "media"
  image     = "ghcr.io/hotio/readarr:latest"
  port      = 8787
  vol = {
    "/zssd/general/config/readarr" = "/config"
    "/data/torrents"               = "/downloads"
    "/data/media/audiobooks"       = "/audiobooks"
    "/data/media/recycle-bin"      = "/recycle-bin"
  }
}

module "lidarr" {
  source    = "../../modules/arr-app"
  namespace = "media"
  image     = "ghcr.io/hotio/lidarr:latest"
  port      = 8686
  vol = {
    "/zssd/general/config/lidarr" = "/config"
    "/data/torrents"              = "/downloads"
    "/data/media/music"           = "/music"
    "/data/media/recycle-bin"     = "/recycle-bin"
  }
}

module "bazarr" {
  source    = "../../modules/arr-app"
  namespace = "media"
  image     = "ghcr.io/hotio/bazarr:latest"
  port      = 6767
  vol = {
    "/zssd/general/config/bazarr" = "/config"
    "/data/media/movies"          = "/movies"
    "/data/media/tv"              = "/tv"
  }
}

module "flaresolverr" {
  source    = "../../modules/arr-app"
  namespace = "media"
  image     = "ghcr.io/flaresolverr/flaresolverr:latest"
  port      = 8191
  vol = {
    "/zssd/general/config/flaresolverr" = "/config"
  }
}

module "tautulli" {
  source    = "../../modules/arr-app"
  namespace = "media"
  image     = "ghcr.io/hotio/tautulli:latest"
  port      = 8181
  vol = {
    "/zssd/general/config/tautulli" = "/config"
  }
}
