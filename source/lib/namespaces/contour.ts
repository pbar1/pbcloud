import * as fluxcd from "../crds/fluxcd";
import * as pbcloud from "../pbcloud";
import * as pulumi from "@pulumi/pulumi";

export class Namespace extends pbcloud.RenderedKubeNamespace {
  constructor(namespace = "contour") {
    super(namespace);
    const opts: pulumi.CustomResourceOptions = { parent: this };

    const helmReleaseArgs: fluxcd.helm.v2beta1.HelmReleaseArgs = {
      metadata: { namespace, name: "contour" },
      spec: {
        interval: "24h",
        chart: {
          spec: {
            chart: "contour",
            sourceRef: {
              kind: "HelmRepository",
              name: "bitnami",
              namespace: "flux-system",
            },
          },
        },
        values: {
          envoy: {
            useHostPort: false,
            // Set Envoy service to NodePort and expose to internet via firewall
            service: {
              type: "NodePort",
              nodePorts: { http: "30438", https: "30439" },
            },
          },
        },
      },
    };
    new fluxcd.helm.v2beta1.HelmRelease("contour", helmReleaseArgs, opts);
  }
}
