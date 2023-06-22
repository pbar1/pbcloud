import * as gk from "../helm/geek_cookbook";
import * as pbcloud from "../pbcloud";
import * as pulumi from "@pulumi/pulumi";

export class Namespace extends pbcloud.RenderedKubeNamespace {
  constructor(namespace = "unifi") {
    super(namespace);
    const opts: pulumi.CustomResourceOptions = { parent: this };

    gk.newGkHelmRelease(
      {
        namespace,
        name: "unifi-controller",
        chart: "unifi",
        values: {
          env: {
            TZ: "America/Los_Angeles",
            UNIFI_GID: "100",
            UNIFI_UID: "1000",
          },
          hostNetwork: true, // TODO: Investigate how to remove
          persistence: {
            data: {
              enabled: true,
              type: "hostPath",
              hostPath: "/data/general/unifi",
              mountPath: "/unifi",
            },
          },
        },
      },
      opts
    );
  }
}
