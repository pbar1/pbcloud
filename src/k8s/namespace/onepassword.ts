import { NamespaceChart } from "../util.ts";
import { Connect } from "@pbcloud/helm/connect.ts";

export function create(ns: NamespaceChart) {
  // Deploy the 1Password Connect operator instead of the secrets injector
  // because the latter injects secrets as environment variables, which are
  // visible in cleartext from the K8s API.
  //
  // Once deployed, run `scripts/onepassword-init.sh` to give it the requisite
  // secrets needed for accessing 1Password.
  // TODO: This doesn't properly install CRDs - but is that an issue?
  new Connect(ns, "connect", {
    // Must be set to avoid `helm template` setting current kubectl namespace
    namespace: ns.name,
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
