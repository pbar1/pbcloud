locals {
  namespace_media = "media"

  config      = "/zssd/general/config"
  torrents    = "/data/torrents"
  recycle_bin = "/data/media/recycle-bin"
  tv          = "/data/media/tv"
  movies      = "/data/media/movies"
  audiobooks  = "/data/media/audiobooks"
  music       = "/data/media/music"
  youtube     = "/data/media/youtube"
}

# TODO: Import state
# resource "kubernetes_namespace" "media" {
#   metadata {
#     name = "media"
#   }
# }

module "prowlarr" {
  source    = "../../modules/app"
  namespace = local.namespace_media
  image     = "ghcr.io/hotio/prowlarr:latest"
  port      = 9696
  vol = {
    "${local.config}/prowlarr" = "/config"
  }
}

module "sonarr" {
  source    = "../../modules/app"
  namespace = local.namespace_media
  image     = "ghcr.io/hotio/sonarr:latest"
  port      = 8989
  vol = {
    "${local.config}/sonarr" = "/config"
    (local.torrents)         = "/downloads"
    (local.tv)               = "/tv"
    (local.recycle_bin)      = "/recycle-bin"
  }
}

module "radarr" {
  source    = "../../modules/app"
  namespace = local.namespace_media
  image     = "ghcr.io/hotio/radarr:latest"
  port      = 7878
  vol = {
    "${local.config}/radarr" = "/config"
    (local.torrents)         = "/downloads"
    (local.movies)           = "/movies"
    (local.recycle_bin)      = "/recycle-bin"
  }
}

module "readarr" {
  source    = "../../modules/app"
  namespace = local.namespace_media
  image     = "ghcr.io/hotio/readarr:latest"
  port      = 8787
  vol = {
    "${local.config}/readarr" = "/config"
    (local.torrents)          = "/downloads"
    (local.audiobooks)        = "/audiobooks"
    (local.recycle_bin)       = "/recycle-bin"
  }
}

module "lidarr" {
  source    = "../../modules/app"
  namespace = local.namespace_media
  image     = "ghcr.io/hotio/lidarr:latest"
  port      = 8686
  vol = {
    "${local.config}/lidarr" = "/config"
    (local.torrents)         = "/downloads"
    (local.music)            = "/music"
    (local.recycle_bin)      = "/recycle-bin"
  }
}

module "bazarr" {
  source    = "../../modules/app"
  namespace = local.namespace_media
  image     = "ghcr.io/hotio/bazarr:latest"
  port      = 6767
  vol = {
    "${local.config}/bazarr" = "/config"
    (local.movies)           = "/movies"
    (local.tv)               = "/tv"
  }
}

module "flaresolverr" {
  source    = "../../modules/app"
  namespace = local.namespace_media
  image     = "ghcr.io/flaresolverr/flaresolverr:latest"
  port      = 8191
  vol = {
    "${local.config}/flaresolverr" = "/config"
  }
}

module "tautulli" {
  source    = "../../modules/app"
  namespace = local.namespace_media
  image     = "ghcr.io/hotio/tautulli:latest"
  port      = 8181
  vol = {
    "${local.config}/tautulli" = "/config"
  }
}

module "overseer" {
  source    = "../../modules/app"
  namespace = local.namespace_media
  image     = "sctx/overseerr:latest"
  port      = 5055
  vol = {
    "${local.config}/overseerr" = "/app/config"
  }
}

module "plex" {
  source       = "../../modules/app"
  namespace    = local.namespace_media
  image        = "ghcr.io/linuxserver/plex:latest"
  port         = 32400
  host_network = true
  vol = {
    "${local.config}/plex" = "/config"
    (local.movies)         = "/movies"
    (local.tv)             = "/tv"
    (local.audiobooks)     = "/audiobooks"
    (local.music)          = "/music"
    (local.youtube)        = "/youtube"
  }
  emptydirs = {
    "/transcode" = "Memory"
  }
}

module "qbittorrent" {
  source         = "../../modules/app"
  namespace      = local.namespace_media
  image          = "ghcr.io/hotio/qbittorrent:latest"
  port           = 8080
  enable_gluetun = true
  env = {
    "QBT_TORRENTING_PORT" = "21133"
  }
  vol = {
    "${local.config}/qbittorrent" = "/config"
    (local.torrents)              = "/downloads"
  }
}
