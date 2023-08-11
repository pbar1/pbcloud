# pbcloud

This is a megarepo containing all of my Kubernetes and other cloud
configuration.

## Design

Configs are written in TypeScript in the [`source`](source) directory, which are
then materialized into an application-consumable format in the
[`materialized`](materialized) directory. For example, Kubernetes configs
materialize to directories of YAML files. Both the source and materialized
configs are committed to version control.

Here is the basic lifecycle of a Kubernetes config:
![pbcloud config flow](assets/config_flow.png)

## Basic Facts

- All live infrastructure code is in [`source/lib/namespaces`](source/lib/namespaces).
  It's broken down by K8s namespace, and in most cases the namespace is created
  automatically by the `pbcloud.RenderedKubeNamespace` class.
  - The exception being if the namespace is created via a raw manifest that we
    import; while this could be overridden via a Pulumi transformation, we have
    not looked into that yet.
- CRDs are imported into Pulumi and useable in TypeScript as modules available
  under [`source/lib/crds`](source/lib/crds). The import pipelne is a bit
  convoluted, but any YAML CRD in the [`.import`](source/lib/crds/.import)
  directory are scrubbed and converted into Pulumi TypeScript modules via the
  Taskfile target `task crds`.
  - CRDs in the import directory are committed as well, as they are the source
    of truth for all the downstream CRD code.
- Live infra in the [`materialized`](materialized) directory is deployed via
  `kubectl apply` initially. After this, the Flux `Kustomization` that was
  created this way keeps the cluster up to date with what's in the repo on a
  periodic basis.
  - This allows us to not have to be beholden to Flux when quickly iterating,
    allowing dual use of Flux and `kubectl apply`. This also helps for
    disaster recovery bringup. Downsides are that one has to do the initial
    apply of the Flux Kustomization; this is an opportunity for future
    improvement in CD/CD.
- [Underlying machine config](https://github.com/pbar1/dotfiles/blob/main/nixos-tec/default.nix)
  is in Nix in a separate repo, currently.

## TODOs

- Materialized configs are not initially applied automatically by Flux. This
  makes sense, because they include the `Kustomization` resource needed to
  control this behavior. This could be better.
- [OpenEBS ZFS][1] K8s StorageClass
- [This guy][2] is using Calico/BGP/MetalLB to put pods on homenet, for Home
  Assistant support.
- Scope out moving from Auth0 to [Authentik][3]
- Reinvestigate deploying Knative but with only internal ingress, exposable via CF tunnel
- Break things up into cells/layers that depend on each other. For example,
  most things can't be deployed until Flux or 1Password have been installed

<!-- Links -->

[1]: https://www.reddit.com/r/kubernetes/comments/q7sw24/a_local_maximum_on_bare_metal_k8s_storage_openebs/
[2]: https://www.technowizardry.net/series/home-lab/
[3]: https://goauthentik.io/
