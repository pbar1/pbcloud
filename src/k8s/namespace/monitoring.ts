import { NamespaceChart } from "../util.ts";
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

      cleanPrometheusOperatorObjectNames: true,
    },
  });
}
