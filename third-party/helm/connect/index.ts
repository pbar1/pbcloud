import * as cdk8s from "cdk8s";
import { Construct } from "constructs";

interface ConnectProps {
  releaseName?: string;
  namespace?: string;
  values?: {
    [key: string]: unknown;
  };
}

export class Connect extends cdk8s.Chart {
  constructor(scope: Construct, id: string, props?: ConnectProps) {
    super(scope, id);

    new cdk8s.Helm(this, "helm", {
      chart: __dirname,
      releaseName: props?.releaseName,
      namespace: props?.namespace,
      values: props?.values,
    });
  }
}
