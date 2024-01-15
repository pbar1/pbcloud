import { Construct } from "constructs";

import * as pbcloud from "../lib/pbcloud";
import { container } from "../lib/workload";

const NAME = "cloudflare";

export class Namespace extends pbcloud.Namespace {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    container("cloudflare/cloudflared:latest")
      .withArgs(["tunnel", "run"])
      .withEnvFrom({ secretRef: { name: "cloudflared" } })
      .withEnv(pbcloud.env("NO_AUTOUPDATE", "true"))
      .asWorkload()
      .withPodAnnotations(pbcloud.opSecret("cloudflared"))
      .withNamespace(name)
      .build(this);
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
