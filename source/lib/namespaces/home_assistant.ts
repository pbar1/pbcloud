import * as pbcloud from "../pbcloud";
import * as pulumi from "@pulumi/pulumi";
import * as geekCookbook from "../helm/geek_cookbook";

export class Namespace extends pbcloud.RenderedKubeNamespace {
  constructor(namespace = "home-assistant") {
    super(namespace);
    const opts: pulumi.CustomResourceOptions = { parent: this };

    const helmArgs: geekCookbook.NewGkHelmReleaseArgs = {
      namespace,
      chart: namespace,
      values: new geekCookbook.GeekCookbookValuesBuilder()
        .withName(namespace)
        .withRepository("ghcr.io/home-assistant/home-assistant")
        .build(),
    };
    geekCookbook.newGkHelmRelease(helmArgs, opts);
  }
}
