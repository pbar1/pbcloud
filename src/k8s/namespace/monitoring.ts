import { NamespaceChart } from "../util.ts";
import { Kubeprometheusstack } from "@pbcloud/helm/kube-prometheus-stack.ts";

export function create(ns: NamespaceChart) {
  // FIXME: Deploy CRDs manually first:
  // https://artifacthub.io/packages/helm/prometheus-community/kube-prometheus-stack#from-64-x-to-65-x
  new Kubeprometheusstack(ns, "kube-prometheus-stack", {
    namespace: ns.name,
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
          retention: "90d",
          storageSpec: {
            volumeClaimTemplate: {
              spec: {
                storageClassName: "local-path",
                accessModes: ["ReadWriteOnce"],
                resources: { requests: { storage: "0Gi" /* no-op */ } },
              },
            },
          },
        },
      },

      cleanPrometheusOperatorObjectNames: true,
    },
  });
}
