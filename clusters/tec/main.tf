terraform {
  backend "kubernetes" {
    config_path   = "~/.kube/config"
    namespace     = "kube-system"
    secret_suffix = "state"
  }
}

provider "kubernetes" {
  config_path = "~/.kube/config"
}
