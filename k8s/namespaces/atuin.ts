import { Construct } from "constructs";

import * as pbcloud from "../lib/pbcloud";

const NAME = "atuin";

export class Namespace extends pbcloud.Namespace {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    // Resources go here
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
