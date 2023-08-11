import * as pbcloud from "../../pbcloud";
import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as path from "path";

// NOTE: Knative has a lot of components; here RenderedKubeNamespace is being
// used to provision the base `knative-operator` namespace, but there are a few
// other namespaces that are also created by these manifests:
// - knative-serving
// - knative-eventing
// - contour-internal
// - contour-external
export class Namespace extends pbcloud.RenderedKubeNamespace {
  constructor(namespace = "knative-operator") {
    super(namespace);
    const opts: pulumi.CustomResourceOptions = { parent: this };

    const name = namespace;
    const manifestArgs: k8s.yaml.ConfigGroupOpts = {
      files: [path.join(__dirname, "manifests", "*.yaml")],
    };
    new k8s.yaml.ConfigGroup(name, manifestArgs, opts);
  }
}
