import { Connect } from "@pbcloud/third-party-helm/connect";
import { Construct } from "constructs";

import * as pbcloud from "../lib/pbcloud";

const NAME = "onepassword";

export class Namespace extends pbcloud.Namespace {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    // Deploy the 1Password Connect operator instead of the secrets injector
    // because the latter injects secrets as environment variables, which are
    // visible in cleartext from the K8s API.
    //
    // Once deployed, run `scripts/1password-init.sh` to give it the requisite
    // secrets needed for accessing 1Password.
    new Connect(this, "connect", {
      releaseName: "connect",
      namespace: name,
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
}

/**
 * Renders Kubernetes manifests for the given namespace.
 */
export function build() {
  const app = new pbcloud.App(NAME);
  new Namespace(app, NAME);
  app.synth();
}
