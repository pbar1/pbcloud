import { k8sRenderProvider, K8sNamespaceType } from "../pbcloud";
import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

const ns = "media";

export class Media extends pulumi.ComponentResource {
  constructor() {
    super(K8sNamespaceType, ns, {}, { providers: [k8sRenderProvider(ns)] });

    const opts: pulumi.CustomResourceOptions = { parent: this };

    new k8s.core.v1.Namespace(ns, { metadata: { name: ns } }, opts);
  }
}
