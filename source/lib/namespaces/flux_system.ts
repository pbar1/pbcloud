import * as crds from "../../crds/gen";
import * as pbcloud from "../pbcloud";
import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

export const HELM_REPOS = {
  "amd-gpu": "https://radeonopencompute.github.io/k8s-device-plugin",
  "external-dns": "https://kubernetes-sigs.github.io/external-dns",
  "geek-cookbook": "https://geek-cookbook.github.io/charts",
  "prometheus-community": "https://prometheus-community.github.io/helm-charts",
  gitea: "https://dl.gitea.io/charts/",
  grafana: "https://grafana.github.io/helm-charts",
  jetstack: "https://charts.jetstack.io",
  mvisonneau: "https://charts.visonneau.fr",
  weaveworks: "oci://ghcr.io/weaveworks/charts",
};

export class Namespace extends pbcloud.RenderedKubeNamespace {
  constructor(namespace = "flux-system") {
    super(namespace);
    const opts: pulumi.CustomResourceOptions = { parent: this };

    for (const [name, url] of Object.entries(HELM_REPOS)) {
      newHelmRepo(name, url, namespace, opts);
    }
  }
}

function newHelmRepo(
  name: string,
  url: string,
  namespace: string,
  opts: pulumi.CustomResourceOptions
): crds.source.v1beta2.HelmRepository {
  const type = url.includes("oci://") ? "oci" : undefined;

  const args: crds.source.v1beta2.HelmRepositoryArgs = {
    metadata: { name, namespace },
    spec: { interval: "24h", url, type },
  };

  return new crds.source.v1beta2.HelmRepository(name, args, opts);
}
