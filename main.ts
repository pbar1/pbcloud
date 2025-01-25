import { App, TerraformStack } from "cdktf";
import { Construct } from "constructs";

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // define resources here
  }
}

const app = new App();
new MyStack(app, "pbcloud");
app.synth();
