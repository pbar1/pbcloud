variable "namespace" {
  type = string
}

variable "image" {
  type = string
}

variable "port" {
  type = number
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
    "app" : local.name
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
        container {
          name  = local.name
          image = var.image
          port {
            container_port = var.port
          }
        }
      }
    }
  }
}
