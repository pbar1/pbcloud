import * as pbcloud from "../../pbcloud";
import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as path from "path";
import * as cf from "../../crds/cloudflare";
import * as op from "../../crds/onepassword";

export class Namespace extends pbcloud.RenderedKubeNamespace {
  constructor(namespace = "cloudflare-operator-system") {
    super(namespace, false); // TODO: Don't create namespace with manifest resources
    const opts: pulumi.CustomResourceOptions = { parent: this };

    // See manifests.yaml for the Kustomize command used to generate
    const manifestArgs: k8s.yaml.ConfigFileOpts = {
      file: path.join(__dirname, "manifests.yaml"),
    };
    new k8s.yaml.ConfigFile("manifests", manifestArgs, opts);

    // Sync Cloudflare creds from 1Password to K8s secret
    const opItemName = "cloudflare-operator-creds";
    const opItemArgs: op.onepassword.v1.OnePasswordItemArgs = {
      metadata: { namespace, name: opItemName },
      spec: { itemPath: "vaults/pbcloud/items/cloudflare-operator" },
    };
    new op.onepassword.v1.OnePasswordItem(opItemName, opItemArgs, opts);

    // Create cluster-wide Cloudflare Tunnel for use via ref by TunnelBindings
    const tunName = "xnauts-net-tunnel";
    const tunArgs: cf.networking.v1alpha1.ClusterTunnelArgs = {
      metadata: { name: tunName },
      spec: {
        cloudflare: {
          accountId: pbcloud.CF_ACCOUNT_ID,
          domain: pbcloud.DOMAIN,
          email: pbcloud.EMAIL,
          secret: opItemName,
        },
        newTunnel: { name: tunName },
      },
    };
    new cf.networking.v1alpha1.ClusterTunnel(tunName, tunArgs, opts);
  }
}
