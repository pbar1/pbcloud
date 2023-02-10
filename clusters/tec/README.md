# clusters/tec

Created via `flux bootstrap` as per the [Flux docs][1]:

```
export GITHUB_TOKEN=<your-token>

# While using the kubectl context of the proper cluster
flux bootstrap github \
  --owner=pbar1 \
  --repository=pbcloud \
  --path=clusters/tec \
  --personal

# Assuming the Flux GPG key is currently in the keyring
gpg --export-secret-keys --armor 40426439B25D67BD53C70F42D9C267B8CD0937BF \
| kubectl create secret generic sops-gpg \
    --namespace=flux-system \
    --from-file=sops.asc=/dev/stdin
```

TODO: Consider [bootstrapping with Terraform][2], if the provider becomes a bit more mature.

[1]: https://fluxcd.io/flux/installation/#github-and-github-enterprise
[2]: https://registry.terraform.io/providers/fluxcd/flux/latest/docs/guides/github
