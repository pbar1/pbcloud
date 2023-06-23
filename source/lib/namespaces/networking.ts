import * as fluxcd from "../crds/fluxcd";
import * as pbcloud from "../pbcloud";
import * as pulumi from "@pulumi/pulumi";

export class Namespace extends pbcloud.RenderedKubeNamespace {
  constructor(namespace = "networking") {
    super(namespace);
    const opts: pulumi.CustomResourceOptions = { parent: this };

    const tsRelayName = "tailscale-relay";
    const tsRelayArgs: fluxcd.helm.v2beta1.HelmReleaseArgs = {
      metadata: { namespace, name: tsRelayName },
      spec: {
        interval: "24h",
        chart: {
          spec: {
            chart: tsRelayName,
            sourceRef: {
              kind: "HelmRepository",
              name: "mvisonneau",
              namespace: "flux-system",
            },
          },
        },
        values: {
          config: {
            authKey: "${TAILSCALE_AUTH_KEY}",
            variables: {
              TAILSCALE_ADVERTISE_ROUTES: "${NETWORK_CIDR}",
              TAILSCALE_HOSTNAME: "tec",
            },
          },
        },
      },
    };
    new fluxcd.helm.v2beta1.HelmRelease(tsRelayName, tsRelayArgs, opts);
  }
}
