import * as pbcloud from "../../pbcloud";
import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as path from "path";

// NOTE: Knative has a lot of components; here RenderedKubeNamespace is being
// used to provision all of the components in their own namespaces, rather than
// one singular "knative" namespace.
export class Namespace extends pbcloud.RenderedKubeNamespace {
  constructor(namespace = "knative") {
    super(namespace, false);
    const opts: pulumi.CustomResourceOptions = { parent: this };

    const name = namespace;
    const manifestArgs: k8s.yaml.ConfigGroupOpts = {
      files: [path.join(__dirname, "manifests", "*.yaml")],
    };
    new k8s.yaml.ConfigGroup(name, manifestArgs, opts);
  }
}
