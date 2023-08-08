import * as fluxcd from "../crds/fluxcd";
import * as pbcloud from "../pbcloud";
import * as pulumi from "@pulumi/pulumi";

export class Namespace extends pbcloud.RenderedKubeNamespace {
  constructor(namespace = "gitea") {
    super(namespace);
    const opts: pulumi.CustomResourceOptions = { parent: this };

    const helmReleaseArgs: fluxcd.helm.v2beta1.HelmReleaseArgs = {
      metadata: { namespace, name: "gitea" },
      spec: {
        interval: "24h",
        chart: {
          spec: {
            chart: "gitea",
            sourceRef: {
              kind: "HelmRepository",
              name: "gitea",
              namespace: "flux-system",
            },
          },
        },
        values: {
          image: {
            pullPolicy: "IfNotPresent",
            rootless: true,
          },
          ingress: {
            enabled: true,
            annotations: {
              "cert-manager.io/cluster-issuer": "letsencrypt-production",
              "ingress.kubernetes.io/force-ssl-redirect": "true",
            },
            hosts: [
              {
                host: "gitea.xnauts.net",
                paths: [{ path: "/", pathType: "Prefix" }],
              },
            ],
            tls: [{ hosts: ["gitea.xnauts.net"], secretName: "gitea-tls" }],
          },
          persistence: {
            enabled: true,
            storageClass: "local-path",
          },
          gitea: {
            config: {
              server: {
                DISABLE_SSH: true,
                START_SSH_SERVER: false,
              },
              database: {
                DB_TYPE: "sqlite3",
              },
            },
          },
          postgresql: { enabled: false },
          memcached: { enabled: false },
        },
      },
    };
    new fluxcd.helm.v2beta1.HelmRelease("gitea", helmReleaseArgs, opts);
  }
}
