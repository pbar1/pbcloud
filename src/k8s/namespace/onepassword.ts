import { NamespaceChart } from "../util.ts";
import { Connect } from "@pbcloud/helm/connect.ts";

export function create(ns: NamespaceChart) {
  new Connect(ns, "connect", {
    values: {
      connect: {
        serviceType: "ClusterIP",
      },
      operator: {
        create: true,
        autoRestart: true,
      },
    },
  });
}
