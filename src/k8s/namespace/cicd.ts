import { NamespaceChart } from "../util.ts";
import { Gitea } from "@pbcloud/helm/gitea.ts";

export function create(ns: NamespaceChart) {
  new Gitea(ns, "gitea", {
    namespace: ns.name,
    releaseName: "gitea",
    values: {
      // Single-pod config
      "redis-cluster": { enabled: false },
      redis: { enabled: false },
      postgresql: { enabled: false },
      "postgresql-ha": { enabled: false },

      gitea: {
        config: {
          // Single-pod config
          // https://artifacthub.io/packages/helm/gitea/gitea#single-pod-configurations
          database: { DB_TYPE: "sqlite3" },
          session: { PROVIDER: "memory" },
          cache: { ADAPTER: "memory" },
          queue: { TYPE: "level" },
        },
      },

      // TODO: Enable when ready
      persistence: { enabled: false },
    },
  });
}
