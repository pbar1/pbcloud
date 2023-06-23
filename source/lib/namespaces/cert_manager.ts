import * as fluxcd from "../crds/fluxcd";
import * as certManager from "../crds/cert-manager";
import * as pbcloud from "../pbcloud";
import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

const CF_SECRET_NAME = "cloudflare-creds";
const CF_API_KEY_ENV_VAR = "CF_API_KEY";

// TODO: CRDs

export class Namespace extends pbcloud.RenderedKubeNamespace {
  constructor(namespace = "cert-manager") {
    super(namespace);
    const opts: pulumi.CustomResourceOptions = { parent: this };

    const chartName = "cert-manager";
    const helmReleaseArgs: fluxcd.helm.v2beta1.HelmReleaseArgs = {
      metadata: {
        name: chartName,
        namespace,
      },
      spec: {
        interval: "24h",
        chart: {
          spec: {
            chart: chartName,
            sourceRef: {
              name: "jetstack",
              namespace: "flux-system",
              kind: "HelmRepository",
            },
          },
        },
        values: {
          installCRDs: false,
          webhook: { enabled: true },
          extraArgs: [
            "--dns01-recursive-nameservers=1.1.1.1:53,9.9.9.9:53",
            "--dns01-recursive-nameservers-only",
          ],
          replicaCount: 1,
          podDnsPolicy: "None",
          podDnsConfig: { nameservers: ["1.1.1.1", "9.9.9.9"] },
        },
      },
    };
    new fluxcd.helm.v2beta1.HelmRelease(chartName, helmReleaseArgs, opts);

    const secretArgs: k8s.core.v1.SecretArgs = {
      metadata: {
        name: CF_SECRET_NAME,
        namespace,
      },
      stringData: {
        [CF_API_KEY_ENV_VAR]: "${" + CF_API_KEY_ENV_VAR + "}", // FIXME: No Flux injection
      },
    };
    new k8s.core.v1.Secret(CF_SECRET_NAME, secretArgs, opts);

    newClusterIssuer(
      "letsencrypt-production",
      "https://acme-v02.api.letsencrypt.org/directory",
      opts
    );

    newClusterIssuer(
      "letsencrypt-staging",
      "https://acme-staging-v02.api.letsencrypt.org/directory",
      opts
    );
  }
}

function newClusterIssuer(
  name: string,
  server: string,
  opts: pulumi.CustomResourceOptions
): certManager.certmanager.v1.ClusterIssuer {
  const args: certManager.certmanager.v1.ClusterIssuerArgs = {
    metadata: { name },
    spec: {
      acme: {
        server,
        email: "${EMAIL}", // FIXME: No Flux injection
        privateKeySecretRef: { name },
        solvers: [
          {
            dns01: {
              cloudflare: {
                email: "${EMAIL}", // FIXME: No Flux injection
                apiKeySecretRef: {
                  name: CF_SECRET_NAME,
                  key: CF_API_KEY_ENV_VAR,
                },
              },
            },
            selector: { dnsZones: ["${DOMAIN}"] }, // FIXME: No Flux injection
          },
        ],
      },
    },
  };
  return new certManager.certmanager.v1.ClusterIssuer(name, args, opts);
}
