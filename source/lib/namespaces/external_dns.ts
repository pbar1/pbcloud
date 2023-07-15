import * as fluxcd from "../crds/fluxcd";
import * as pbcloud from "../pbcloud";
import * as pulumi from "@pulumi/pulumi";

export class Namespace extends pbcloud.RenderedKubeNamespace {
  constructor(namespace = "external-dns") {
    super(namespace);
    const opts: pulumi.CustomResourceOptions = { parent: this };

    const externalDnsArgs: fluxcd.helm.v2beta1.HelmReleaseArgs = {
      metadata: { namespace, name: namespace },
      spec: {
        interval: "24h",
        chart: {
          spec: {
            chart: namespace,
            sourceRef: {
              kind: "HelmRepository",
              name: namespace,
              namespace: "flux-system",
            },
          },
        },
        values: {
          logLevel: "debug",
          provider: "cloudflare",
          podAnnotations: {
            "operator.1password.io/item-name": "cloudflare-creds",
            "operator.1password.io/item-path":
              "vaults/pbcloud/items/cloudflare",
          },
          env: [
            {
              name: "CF_API_EMAIL",
              valueFrom: {
                secretKeyRef: {
                  name: "cloudflare-creds",
                  key: "CF_API_EMAIL",
                },
              },
            },
            {
              name: "CF_API_KEY",
              valueFrom: {
                secretKeyRef: {
                  name: "cloudflare-creds",
                  key: "CF_API_KEY",
                },
              },
            },
          ],
        },
      },
    };
    new fluxcd.helm.v2beta1.HelmRelease(namespace, externalDnsArgs, opts);
  }
}
