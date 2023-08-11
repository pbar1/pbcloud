import * as fluxcd from "../crds/fluxcd";
import * as pbcloud from "../pbcloud";
import * as pulumi from "@pulumi/pulumi";

export class Namespace extends pbcloud.RenderedKubeNamespace {
  constructor(namespace = "contour") {
    super(namespace);
    const opts: pulumi.CustomResourceOptions = { parent: this };

    const name = namespace;
    const values = {
      envoy: {
        useHostPort: false,
        service: {
          ipFamilyPolicy: "RequireDualStack",
        },
      },
    };
    const hrArgs = pbcloud.helmRelease(
      namespace,
      name,
      "bitnami",
      "contour",
      values
    );
    new fluxcd.helm.v2beta1.HelmRelease(name, hrArgs, opts);
  }
}
