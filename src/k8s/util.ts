import * as k8s from "@pbcloud/crd/k8s";
import * as cdk8s from "cdk8s";
import { Construct } from "constructs";

export class K8sApp extends cdk8s.App {
  constructor(props?: cdk8s.AppProps) {
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
