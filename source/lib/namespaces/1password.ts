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
    // Run the following after creating the namespace but before creating the
    // Helm release:
    // ```
    // eval (op signin)
    // cat ~/Downloads/1password-credentials.json | base64 --wrap=0 > 1password-credentials.json
    // # For Connect
    // kubectl create secret generic op-credentials --from-file=1password-credentials.json --namespace=1password
    // # For operator
    // kubectl create secret generic onepassword-token --from-literal=token=(op item get '1Password Secrets Automation: pbcloud' --fields=credential) --namespace=1password
    // ```
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
