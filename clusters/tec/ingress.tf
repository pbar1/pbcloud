locals {
  ns_ingress = kubernetes_namespace.ingress.metadata[0].name

  cloudflared        = "cloudflared"
  cloudflared_labels = { app = local.cloudflared }
}

resource "kubernetes_namespace" "ingress" {
  metadata {
    name = "ingress"
  }
}

# Cloudflare ------------------------------------------------------------------

data "onepassword_item" "cloudflared" {
  vault = "private"
  title = "cloudflared TUNNEL_TOKEN (xnauts-net)"
}

resource "kubernetes_secret" "cloudflared" {
  metadata {
    name      = local.cloudflared
    namespace = local.ns_ingress
  }
  data = {
    TUNNEL_TOKEN = data.onepassword_item.cloudflared.credential
  }
}

resource "kubernetes_deployment" "cloudflared" {
  metadata {
    name      = local.cloudflared
    namespace = local.ns_ingress
  }
  spec {
    replicas = 1
    selector {
      match_labels = local.cloudflared_labels
    }
    template {
      metadata {
        labels = local.cloudflared_labels
      }
      spec {
        container {
          name  = local.cloudflared
          image = "docker.io/cloudflare/cloudflared:latest"
          args  = ["tunnel", "run"]
          env {
            name  = "NO_AUTOUPDATE"
            value = "true"
          }
          env_from {
            secret_ref {
              name = kubernetes_secret.cloudflared.metadata[0].name
            }
          }
        }
      }
    }
  }
}
