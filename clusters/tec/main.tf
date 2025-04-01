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
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5"
    }
  }
}

# Uses 1Password CLI integration
provider "onepassword" {
  account = "my.1password.com"
}

provider "cloudflare" {
  email   = data.onepassword_item.cloudflare_api.username
  api_key = data.onepassword_item.cloudflare_api.credential
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

data "onepassword_item" "cloudflare_api" {
  vault = "private"
  title = "Cloudflare API Key"
}
