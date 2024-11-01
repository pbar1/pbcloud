import { NamespaceChart, run } from "../util.ts";
import { Kubeprometheusstack } from "@pbcloud/helm/kube-prometheus-stack.ts";

export function create(ns: NamespaceChart) {
  // FIXME: Deploy CRDs manually first:
  // https://artifacthub.io/packages/helm/prometheus-community/kube-prometheus-stack#from-64-x-to-65-x
  // See `scripts/kps-deletion-order.txt` for what order to safely to delete K8s resources
  const kpsName = "kube-prometheus-stack";
  new Kubeprometheusstack(ns, kpsName, {
    namespace: ns.name,
    releaseName: kpsName,
    values: {
      alertmanager: {
        enabled: false,
      },

      grafana: {
        defaultDashboardsTimezone: "browser",
        persistence: { enabled: true, storageClassName: "local-path" },
      },

      prometheus: {
        prometheusSpec: {
          // Enable to receive OTLP
          // https://prometheus.io/docs/guides/opentelemetry
          // additionalArgs: [{ name: "web.enable-otlp-receiver" }],
          // https://prometheus.io/docs/prometheus/latest/feature_flags/#otlp-receiver
          enableFeatures: ["otlp-write-receiver"],
          retention: "90d",
          storageSpec: {
            volumeClaimTemplate: {
              spec: {
                storageClassName: "local-path",
                accessModes: ["ReadWriteOnce"],
                resources: { requests: { storage: "1Gi" /* no-op */ } },
              },
            },
          },
        },
      },

      kubeControllerManager: { enabled: false },
      kubeProxy: { enabled: false },
      kubeScheduler: { enabled: false },

      cleanPrometheusOperatorObjectNames: true,
    },
  });

  // FIXME: Expose otlp ports
  run(ns, "mcr.microsoft.com/dotnet/aspire-dashboard:latest", {
    port: 18888,
    mountConfig: false,
    mountTmp: false,
    env: {
      ASPNETCORE_URLS: "http://0.0.0.0:18888",
      DOTNET_DASHBOARD_UNSECURED_ALLOW_ANONYMOUS: "true",
    },
  });
}
