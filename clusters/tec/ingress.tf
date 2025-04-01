locals {
  ns_ingress = kubernetes_namespace.ingress.metadata[0].name
}

resource "kubernetes_namespace" "ingress" {
  metadata {
    name = "ingress"
  }
}

data "onepassword_item" "cloudflared" {
  vault = "private"
  title = "cloudflared TUNNEL_TOKEN (xnauts-net)"
}

resource "kubernetes_secret" "cloudflared" {
  metadata {
    name      = "cloudflared"
    namespace = local.ns_ingress
  }
  data = {
    TUNNEL_TOKEN = data.onepassword_item.cloudflared.credential
  }
}

resource "kubernetes_deployment" "cloudflared" {
  metadata {
    name      = "cloudflared"
    namespace = local.ns_ingress
  }
  spec {
    replicas = 1
    selector {
      match_labels = {
        "app" = "cloudflared"
      }
    }
    template {
      metadata {
        labels = {
          "app" = "cloudflared"
        }
      }
      spec {
        container {
          name  = "cloudflared"
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
