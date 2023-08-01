import * as fluxcd from "../crds/fluxcd";
import * as pbcloud from "../pbcloud";
import * as pulumi from "@pulumi/pulumi";

// TODO: Deploy Vault 1Password plugin
// https://github.com/1Password/vault-plugin-secrets-onepassword

export class Namespace extends pbcloud.RenderedKubeNamespace {
  constructor(namespace = "1password") {
    super(namespace);
    const opts: pulumi.CustomResourceOptions = { parent: this };

    // Deploy the 1Password Connect operator instead of the secrets injector
    // because the latter injects secrets as environment variables, which are
    // visible in cleartext from the K8s API.
    //
    // Once deployed, run `scripts/1password-init.sh` to give it the requisite
    // secrets needed for accessing 1Password.
    const opConnectName = "connect";
    const opConnectArgs: fluxcd.helm.v2beta1.HelmReleaseArgs = {
      metadata: { name: opConnectName, namespace },
      spec: {
        interval: "24h",
        chart: {
          spec: {
            chart: opConnectName,
            sourceRef: {
              kind: "HelmRepository",
              name: "1password",
              namespace: "flux-system",
            },
          },
        },
        values: {
          operator: { create: true },
        },
      },
    };
    new fluxcd.helm.v2beta1.HelmRelease(opConnectName, opConnectArgs, opts);
  }
}
