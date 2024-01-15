import * as cdk8s from "cdk8s";
import { Construct } from "constructs";

interface LokiStackProps {
  releaseName?: string;
  namespace?: string;
  values?: {
    [key: string]: unknown;
  };
}

export class LokiStack extends cdk8s.Chart {
  constructor(scope: Construct, id: string, props?: LokiStackProps) {
    super(scope, id);

    new cdk8s.Helm(this, "helm", {
      chart: __dirname,
      releaseName: props?.releaseName,
      namespace: props?.namespace,
      values: props?.values,
    });
  }
}
