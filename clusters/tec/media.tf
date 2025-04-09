locals {
  ns_media = "media"

  config      = "/zssd/general/config"
  torrents    = "/data/torrents"
  recycle_bin = "/data/media/recycle-bin"
  tv          = "/data/media/tv"
  movies      = "/data/media/movies"
  audiobooks  = "/data/media/audiobooks"
  music       = "/data/media/music"
  youtube     = "/data/media/youtube"
}

module "prowlarr" {
  source    = "../../modules/app"
  namespace = local.ns_media
  image     = "ghcr.io/hotio/prowlarr:latest"
  port      = 9696
  vol = {
    "${local.config}/prowlarr" = "/config"
  }
}

module "sonarr" {
  source    = "../../modules/app"
  namespace = local.ns_media
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
  namespace = local.ns_media
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
  namespace = local.ns_media
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
  namespace = local.ns_media
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
  namespace = local.ns_media
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
  namespace = local.ns_media
  image     = "ghcr.io/flaresolverr/flaresolverr:latest"
  port      = 8191
  vol = {
    "${local.config}/flaresolverr" = "/config"
  }
}

module "tautulli" {
  source    = "../../modules/app"
  namespace = local.ns_media
  image     = "ghcr.io/hotio/tautulli:latest"
  port      = 8181
  vol = {
    "${local.config}/tautulli" = "/config"
  }
}

module "overseer" {
  source    = "../../modules/app"
  namespace = local.ns_media
  image     = "sctx/overseerr:latest"
  port      = 5055
  vol = {
    "${local.config}/overseerr" = "/app/config"
  }
}

module "plex" {
  source       = "../../modules/app"
  namespace    = local.ns_media
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
  namespace      = local.ns_media
  image          = "ghcr.io/hotio/qbittorrent:latest"
  port           = 8080
  enable_gluetun = true
  dns_policy     = "Default" // required for resolving public queries
  env = {
    "QBT_TORRENTING_PORT" = "21133"
  }
  vol = {
    "${local.config}/qbittorrent" = "/config"
    (local.torrents)              = "/downloads"
  }
}

# SMB -------------------------------------------------------------------------

resource "kubernetes_service" "smb" {
  metadata {
    name      = "smb"
    namespace = local.ns_media
  }

  spec {
    type = "LoadBalancer"

    port {
      port        = 139
      protocol    = "TCP"
      target_port = 139
      name        = "smb-netbios"
    }

    port {
      port        = 445
      protocol    = "TCP"
      target_port = 445
      name        = "smb-tcp"
    }

    selector = {
      run = "smb"
    }
  }
}

resource "kubernetes_pod" "smb" {
  metadata {
    name      = "smb"
    namespace = local.ns_media
    labels = {
      run = "smb"
    }
  }

  spec {
    container {
      name  = "smb"
      image = "dperson/samba"

      args = [
        "-u",
        "user;pass",
        "-s",
        "mount;/mount;yes;yes;no;user"
      ]

      env {
        name  = "USERID"
        value = "1000"
      }

      env {
        name  = "GROUPID"
        value = "100"
      }

      env {
        name  = "TZ"
        value = "America/Los_Angeles"
      }

      port {
        container_port = 139
      }

      port {
        container_port = 445
      }

      volume_mount {
        name       = "media"
        mount_path = "/mount"
      }
    }

    volume {
      name = "media"
      host_path {
        path = "/data/media"
      }
    }
  }
}
