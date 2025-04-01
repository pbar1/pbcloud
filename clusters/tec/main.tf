terraform {
  backend "kubernetes" {
    config_path   = "~/.kube/config.tec.yaml"
    namespace     = "kube-system"
    secret_suffix = "state"
  }

  required_providers {
    onepassword = {
      source  = "1Password/onepassword"
      version = "~> 2"
    }
  }
}

provider "kubernetes" {
  config_path = "~/.kube/config.tec.yaml"
}

provider "helm" {
  kubernetes {
    config_path = "~/.kube/config.tec.yaml"
  }
  experiments {
    manifest = true
  }
}

provider "onepassword" {
  account = "my.1password.com"
}
