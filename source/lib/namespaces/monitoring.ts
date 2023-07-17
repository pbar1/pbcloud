import * as pbcloud from "../pbcloud";
import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as fluxcd from "../crds/fluxcd";

export class Namespace extends pbcloud.RenderedKubeNamespace {
  constructor(namespace = "monitoring") {
    super(namespace);
    const opts: pulumi.CustomResourceOptions = { parent: this };

    const prometheusArgs: fluxcd.helm.v2beta1.HelmReleaseArgs = {
      metadata: { namespace, name: "kube-prometheus-stack" },
      spec: {
        interval: "24h",
        chart: {
          spec: {
            chart: "kube-prometheus-stack",
            sourceRef: {
              kind: "HelmRepository",
              name: "prometheus-community",
              namespace: "flux-system",
            },
          },
        },
        // TODO: Consider installing CRDs with Flux instead of Helm
        // https://github.com/prometheus-community/helm-charts/blob/main/charts/kube-prometheus-stack/values.yaml
        values: {
          alertmanager: {
            ingress: prometheusValuesIngress("alertmanager"),
          },

          // https://github.com/grafana/helm-charts/blob/main/charts/grafana/values.yaml
          grafana: {
            defaultDashboardsTimezone: "browser",
            adminPassword: "grafana",
            ingress: prometheusValuesIngress("grafana"),
            persistence: { enabled: true, storageClassName: "local-path" },
          },

          prometheus: {
            ingress: prometheusValuesIngress("prometheus"),
            prometheusSpec: {
              retention: "30d",
              storageSpec: {
                volumeClaimTemplate: {
                  spec: {
                    storageClassName: "local-path",
                    accessModes: ["ReadWriteOnce"],
                    resources: { requests: { storage: "5Gi" } }, // NOTE: no-op with local-path
                  },
                },
              },
              additionalScrapeConfigs: [
                // https://grafana.com/blog/2021/02/09/how-i-monitor-my-openwrt-router-with-grafana-cloud-and-prometheus/
                {
                  job_name: "OpenWrt",
                  static_configs: [{ targets: ["192.168.0.1:9100"] }],
                },
              ],
            },
          },
        },
      },
    };
    new fluxcd.helm.v2beta1.HelmRelease(
      "kube-prometheus-stack",
      prometheusArgs,
      opts
    );

    const lokiArgs: fluxcd.helm.v2beta1.HelmReleaseArgs = {
      metadata: { namespace, name: "loki-stack" },
      spec: {
        interval: "24h",
        chart: {
          spec: {
            chart: "loki-stack",
            sourceRef: {
              kind: "HelmRepository",
              name: "grafana",
              namespace: "flux-system",
            },
          },
        },
        values: {
          loki: {
            config: {
              limits_config: { retention_period: "168h" },
            },
            persistence: {
              enabled: true,
              storageClassName: "local-path",
              accessModes: ["ReadWriteOnce"],
              size: "10Gi", // NOTE: no-op with local-path
            },
          },

          promtail: {
            // For proper JSON log parsing. See: https://github.com/grafana/helm-charts/issues/195
            pipelineStages: [{ cri: {} }],
          },
        },
      },
    };
    new fluxcd.helm.v2beta1.HelmRelease("loki-stack", lokiArgs, opts);
  }
}

interface PromethesValuesIngress {
  enabled: boolean;
  annotations: { [key: string]: string | number | boolean };
  hosts: string[];
  paths: string[];
  tls: { hosts: string[]; secretName: string }[];
}

function prometheusValuesIngress(name: string): PromethesValuesIngress {
  const host = `${name}.xnauts.net`;
  return {
    enabled: true,
    annotations: {
      "cert-manager.io/cluster-issuer": "letsencrypt-production",
      "traefik.ingress.kubernetes.io/router.entrypoints": "websecure",
    },
    hosts: [host],
    paths: ["/"],
    tls: [{ hosts: [host], secretName: `${name}-tls` }],
  };
}
