import * as k8s from "@pbcloud/crd/k8s.ts";
import * as cdk8s from "cdk8s";
import * as path from "node:path";
import * as url from "node:url";
import { Construct } from "constructs";

export class K8sApp extends cdk8s.App {
  constructor(props?: cdk8s.AppProps) {
    const __filename = url.fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    super({
      ...props,
      yamlOutputType: cdk8s.YamlOutputType.FOLDER_PER_CHART_FILE_PER_RESOURCE,
      outdir: `${__dirname}/../../out/k8s`,
    });
  }
}

export class NamespaceChart extends cdk8s.Chart {
  constructor(scope: Construct, name: string) {
    super(scope, name, {
      disableResourceNameHashes: true,
      namespace: name,
    });
    new k8s.Namespace(this, name);
  }
}
