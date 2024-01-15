import * as fs from "fs";
import * as process from "process";

const name = process.argv[2];

const template = `
import { Construct } from "constructs";

import * as pbcloud from "../lib/pbcloud";

const NAME = "${name}";

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
`.trimStart();

fs.writeFileSync(`k8s/namespaces/${name}.ts`, template);
