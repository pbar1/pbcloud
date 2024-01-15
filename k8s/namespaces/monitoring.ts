import { KubePrometheusStack } from "@pbcloud/third-party-helm/kube-prometheus-stack";
import { LokiStack } from "@pbcloud/third-party-helm/loki-stack";
import { Construct } from "constructs";

import * as pbcloud from "../lib/pbcloud";

const NAME = "monitoring";

export class Namespace extends pbcloud.Namespace {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new KubePrometheusStack(this, "kube-prometheus-stack", {
      releaseName: "kube-prometheus-stack",
      namespace: name,
      values: {
        // https://github.com/grafana/helm-charts/blob/main/charts/grafana/values.yaml
        grafana: {
          defaultDashboardsTimezone: "browser",
          adminPassword: "grafana",
          persistence: { enabled: true, storageClassName: "local-path" },
        },
        prometheus: {
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
    });

    new LokiStack(this, "loki-stack", {
      releaseName: "loki-stack",
      namespace: name,
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
    });
  }
}

/**
 * Renders Kubernetes manifests for the given namespace.
 */
export function build() {
  const app = new pbcloud.App(NAME);
  new Namespace(app, NAME);
  app.synth();
}
