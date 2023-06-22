import * as k8s from "@pulumi/kubernetes";
import { ComponentResource, CustomResourceOptions } from "@pulumi/pulumi";

export const K8sNamespaceType = "pulumi:component:KubernetesNamespace";

export class K8sNamespaceRender extends ComponentResource {
  constructor(namespace: string) {
    const k8sProvider = new k8s.Provider(namespace, {
      renderYamlToDirectory: `rendered/${namespace}`,
    });

    super(
      "pulumi:component:K8sNamespaceRender",
      namespace,
      {},
      { providers: [k8sProvider] }
    );

    new k8s.core.v1.Namespace(
      namespace,
      { metadata: { name: namespace } },
      { parent: this }
    );
  }
}

export function k8sRenderProvider(name: string): k8s.Provider {
  return new k8s.Provider(name, {
    renderYamlToDirectory: `rendered/${name}`,
  });
}
