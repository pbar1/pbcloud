import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as fluxcd from "./crds/fluxcd";

export const EMAIL = "piercebartine@gmail.com";
export const DOMAIN = "xnauts.net";
export const CF_ACCOUNT_ID = "17d824c0799bab4158f3b78200dc4322";

export class RenderedKubeNamespace extends pulumi.ComponentResource {
  constructor(name: string, createNamespace = true) {
    const type = "pbcloud:RenderedKubeNamespace";

    const renderDir = `materialized/${name}`;
    const k8sRenderProvider = new k8s.Provider(name, {
      renderYamlToDirectory: renderDir,
    });
    const componentOpts: pulumi.ComponentResourceOptions = {
      providers: [k8sRenderProvider],
    };

    super(type, name, {}, componentOpts);

    const resourceOpts: pulumi.CustomResourceOptions = { parent: this };

    if (createNamespace) {
      new k8s.core.v1.Namespace(name, { metadata: { name } }, resourceOpts);
    }

    newKustomization(name, renderDir, resourceOpts);
  }
}

function newKustomization(
  name: string,
  renderDir: string,
  opts: pulumi.CustomResourceOptions
): fluxcd.kustomize.v1beta2.Kustomization {
  const args: fluxcd.kustomize.v1beta2.KustomizationArgs = {
    metadata: { name, namespace: name },
    spec: {
      interval: "24h",
      path: `./${renderDir}`,
      prune: true,
      sourceRef: {
        kind: "GitRepository",
        name: "flux-system",
        namespace: "flux-system",
      },
    },
  };

  return new fluxcd.kustomize.v1beta2.Kustomization(name, args, opts);
}

export function helmChart(
  repo: string,
  chart: string,
  sourceRefKind: string = "HelmRepository",
  sourceRefNamespace: string = "flux-system"
): fluxcd.types.input.helm.v2beta1.HelmReleaseSpecChartArgs {
  return {
    spec: {
      chart: chart,
      sourceRef: {
        kind: sourceRefKind,
        name: repo,
        namespace: sourceRefNamespace,
      },
    },
  };
}

export function helmRelease(
  namespace: string,
  name: string,
  repo: string,
  chart: string,
  values: { [key: string]: any },
  sourceRefKind: string = "HelmRepository",
  sourceRefNamespace: string = "flux-system",
  interval: string = "24h"
): fluxcd.helm.v2beta1.HelmReleaseArgs {
  return {
    metadata: { namespace, name },
    spec: {
      interval,
      chart: helmChart(repo, chart),
      values,
    },
  };
}
