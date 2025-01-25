import { namespace, service } from "@cdktf/provider-kubernetes";
import { App, TerraformStack } from "cdktf";
import { Construct } from "constructs";

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new namespace.Namespace(scope, "test-ns", {
      metadata: { name: "test" },
    });

    new service.Service(scope, "test-svc", {
      metadata: { name: "sonarr", namespace: "test" },
      spec: {
        port: [{ port: 8989 }],
      },
    });
  }
}

const app = new App();
new MyStack(app, "pbcloud");
app.synth();
