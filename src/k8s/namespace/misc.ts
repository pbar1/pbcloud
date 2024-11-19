import { NamespaceChart, run } from "../util.ts";

export function create(ns: NamespaceChart) {
  // FIXME: Delete Startup Probe programmatically. It's just been manually
  // removed for now in the materialized config.
  run(ns, "neosmemo/memos:stable", {
    port: 5230,
    env: {
      MEMOS_MODE: "prod",
      MEMOS_ADDR: "0.0.0.0",
      MEMOS_PORT: "5320",
      MEMOS_DATA: "/var/opt/memos",
      MEMOS_DRIVER: "sqlite",
    },
    hostPaths: { "/var/opt/memos": "/zssd/general/memos" },
    mountConfig: false,
    mountTmp: false,
  });
}
