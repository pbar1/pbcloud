import { ChartProps, App, Chart } from "cdk8s";
import { Construct } from "constructs";

export class MyChart extends Chart {
  constructor(scope: Construct, id: string, props: ChartProps = {}) {
    super(scope, id, props);

    // define resources here
  }
}

const app = new App();
new MyChart(app, "pbcloud-k8s");
app.synth();
