variable "namespace" {
  type        = string
  description = "Kubernetes namespace"
}

variable "image" {
  type        = string
  description = "Container image to run"
}

variable "port" {
  type        = number
  description = "Port to be exposed"
}

variable "env" {
  type        = map(string)
  description = "Container environment variables"
  default     = {}
}

variable "vol" {
  type        = map(string)
  description = "Host path to container path mappings"
  default     = {}
}

variable "emptydirs" {
  type        = map(string)
  description = "emptyDir container path to medium mappings"
  default     = {}
}

variable "host_network" {
  type        = bool
  description = "Container uses the host network namespace instead of its own"
  default     = false
}

variable "enable_gluetun" {
  type        = bool
  description = "Adds sidecar container running gluetun to route all pod traffic through a VPN"
  default     = false
}

locals {
  name = try(
    regex("^([^/:]+)(?::[^/]+)?$",
      element(
        split("/", var.image),
        length(split("/", var.image)) - 1
      )
    )[0],
    var.image
  )

  labels = {
    "app" = local.name
  }

  env_default = {
    PUID = "1000"
    PGID = "100"
    TZ   = "America/Los_Angeles"
  }

  env = merge(local.env_default, var.env)

  vol = {
    for host_path, container_path in var.vol :
    element(compact(split("/", container_path)), -1) => {
      host_path      = host_path
      container_path = container_path
    }
  }

  emptydirs = {
    for container_path, medium in var.emptydirs :
    element(compact(split("/", container_path)), -1) => {
      container_path = container_path,
      medium         = medium
    }
  }

  gluetun_env = {
    VPN_SERVICE_PROVIDER        = "airvpn"
    VPN_TYPE                    = "wireguard"
    WIREGUARD_ADDRESSES         = "10.184.150.109/32"
    SERVER_COUNTRIES            = "Switzerland"
    FIREWALL_VPN_INPUT_PORTS    = "21133"
    HEALTH_VPN_DURATION_INITIAL = "120s"
    PUBLICIP_API                = "cloudflare"
  }
}

resource "kubernetes_service" "app" {
  metadata {
    name      = local.name
    namespace = var.namespace
  }
  spec {
    selector   = local.labels
    cluster_ip = "None"
    port {
      port = var.port
    }
  }
}

resource "kubernetes_stateful_set" "app" {
  metadata {
    name      = local.name
    namespace = var.namespace
  }
  spec {
    service_name = kubernetes_service.app.metadata[0].name
    selector {
      match_labels = local.labels
    }
    template {
      metadata {
        labels = local.labels
      }
      spec {
        host_network = var.host_network

        # main container
        container {
          name  = local.name
          image = var.image
          port {
            container_port = var.port
          }
          dynamic "env" {
            for_each = local.env
            content {
              name  = env.key
              value = env.value
            }
          }

          # hostpaths
          dynamic "volume_mount" {
            for_each = local.vol
            content {
              name       = volume_mount.key
              mount_path = volume_mount.value.container_path
            }
          }

          # emptyDirs
          dynamic "volume_mount" {
            for_each = local.emptydirs
            content {
              name       = volume_mount.key
              mount_path = volume_mount.value.container_path
            }
          }
        }

        # hostpaths
        dynamic "volume" {
          for_each = local.vol
          content {
            name = volume.key
            host_path {
              path = volume.value.host_path
            }
          }
        }

        # emptyDirs
        dynamic "volume" {
          for_each = local.emptydirs
          content {
            name = volume.key
            empty_dir {
              medium = volume.value.medium
            }
          }
        }

        # gluetun container
        dynamic "container" {
          for_each = var.enable_gluetun ? [1] : []
          content {
            name  = "gluetun"
            image = "docker.io/qmcgaw/gluetun:latest"

            security_context {
              capabilities {
                add = ["NET_ADMIN"]
              }
            }

            # must be created out of band with `scripts/sync-secrets`
            env_from {
              secret_ref {
                name = "gluetun"
              }
            }

            dynamic "env" {
              for_each = local.gluetun_env
              content {
                name  = env.key
                value = env.value
              }
            }

          }
        } # gluetun container
      }   # pod spec
    }     # pod template
  }       # statefulset spec
}         # statefulset
