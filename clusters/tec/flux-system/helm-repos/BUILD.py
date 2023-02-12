#!/usr/bin/env nix-shell
#!nix-shell -i python3 -p "python3.withPackages (ps: with ps; [ pyyaml ])"

import os
import yaml

scriptdir = os.path.dirname(os.path.realpath(__file__))
os.chdir(scriptdir)

helm_repos = {
  "amd-gpu": "https://radeonopencompute.github.io/k8s-device-plugin",
  "external-dns": "https://kubernetes-sigs.github.io/external-dns",
  "grafana": "https://grafana.github.io/helm-charts",
  "jetstack": "https://charts.jetstack.io",
  "k8s-at-home": "https://k8s-at-home.com/charts",
  "prometheus-community": "https://prometheus-community.github.io/helm-charts",
  "weaveworks": "oci://ghcr.io/weaveworks/charts",
}

resources = []
for name, url in helm_repos.items():
    helm_repo = {
        "apiVersion": "source.toolkit.fluxcd.io/v1beta2",
        "kind": "HelmRepository",
        "metadata": {
            "name": name,
            "namespace": "flux-system",
        },
        "spec": {
            "interval": "24h",
            "url": url,
        },
    }
    if url.startswith("oci://"):
        helm_repo["spec"]["type"] = "oci"

    yaml_filename = f"{name}.yaml"
    with open(yaml_filename, "w") as file:
        yaml.safe_dump(helm_repo, file)
    resources.append(yaml_filename)

resources.sort()
kustomization = {
    "apiVersion": "kustomize.config.k8s.io/v1beta1",
    "kind": "Kustomization",
    "resources": resources
}
with open("kustomization.yaml", "w") as file:
    yaml.safe_dump(kustomization, file)
