import { NamespaceChart } from "../util.ts";
import { Gitea } from "@pbcloud/helm/gitea.ts";

export function create(ns: NamespaceChart) {
  // Single-pod config for ease
  // https://artifacthub.io/packages/helm/gitea/gitea#single-pod-configurations
  new Gitea(ns, "gitea", {
    namespace: ns.name,
    releaseName: "gitea",
    values: {
      "redis-cluster": { enabled: false },
      redis: { enabled: false },
      postgresql: { enabled: false },
      "postgresql-ha": { enabled: false },

      gitea: {
        admin: {
          password: "initial password only",
          passwordMode: "initialOnlyRequireReset",
        },
        config: {
          server: { ROOT_URL: "https://git.xnauts.net" },
          database: { DB_TYPE: "sqlite3" },
          session: { PROVIDER: "memory" },
          cache: { ADAPTER: "memory" },
          queue: { TYPE: "level" },
        },
      },

      persistence: { enabled: true },
    },
  });
}
