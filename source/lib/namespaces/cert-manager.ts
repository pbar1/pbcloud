import * as crds from "../../crds/gen";
import { k8sRenderProvider, K8sNamespaceType } from "../pbcloud";
import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

const NAMESPACE = "cert-manager";
const CF_SECRET_NAME = "cloudflare-creds";
const CF_API_KEY_ENV_VAR = "CF_API_KEY";

function newClusterIssuer(
  name: string,
  server: string,
  opts: pulumi.CustomResourceOptions
): crds.certmanager.v1.ClusterIssuer {
  const args: crds.certmanager.v1.ClusterIssuerArgs = {
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
  return new crds.certmanager.v1.ClusterIssuer(name, args, opts);
}

export class CertManagerNamespace extends pulumi.ComponentResource {
  constructor() {
    super(
      K8sNamespaceType,
      NAMESPACE,
      {},
      { providers: [k8sRenderProvider(NAMESPACE)] }
    );
    const opts: pulumi.CustomResourceOptions = { parent: this };

    new k8s.core.v1.Namespace(
      NAMESPACE,
      { metadata: { name: NAMESPACE } },
      opts
    );

    const helmReleaseName = NAMESPACE;
    const helmReleaseArgs: crds.helm.v2beta1.HelmReleaseArgs = {
      metadata: {
        name: helmReleaseName,
        namespace: NAMESPACE,
      },
      spec: {
        interval: "24h",
        chart: {
          spec: {
            chart: "cert-manager",
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
    new crds.helm.v2beta1.HelmRelease(NAMESPACE, helmReleaseArgs, opts);

    const secretArgs: k8s.core.v1.SecretArgs = {
      metadata: {
        name: CF_SECRET_NAME,
        namespace: NAMESPACE,
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
