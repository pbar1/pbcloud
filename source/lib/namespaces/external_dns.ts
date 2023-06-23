import * as fluxcd from "../crds/fluxcd";
import * as pbcloud from "../pbcloud";
import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";

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
          env: [
            {
              name: "CF_API_EMAIL",
              value: "${EMAIL}",
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

    const secretName = "cloudflare-creds";
    const secretArgs: k8s.core.v1.SecretArgs = {
      metadata: { namespace, name: secretName },
      stringData: {
        CF_API_KEY: "${CF_API_KEY}", // FIXME: No flux injection
      },
    };
    // FIXME: prefix all resources with namespace
    new k8s.core.v1.Secret(namespace + "/" + secretName, secretArgs, opts);
  }
}
