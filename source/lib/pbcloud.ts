import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

export class RenderedKubeNamespace extends pulumi.ComponentResource {
  constructor(name: string, createNamespace = true) {
    const type = "pulumi:component:RenderedKubeNamespace";

    const k8sRenderProvider = new k8s.Provider(name, {
      renderYamlToDirectory: `materialized/${name}`,
    });

    const opts: pulumi.ComponentResourceOptions = {
      providers: [k8sRenderProvider],
    };

    super(type, name, {}, opts);

    if (createNamespace) {
      new k8s.core.v1.Namespace(name, { metadata: { name } }, { parent: this });
    }
  }
}
