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

## TODOs

- Materialized configs are not initially applied automatically by Flux. This
  makes sense, because they include the `Kustomization` resource needed to
  control this behavior. This could be better.
- [OpenEBS ZFS][1] K8s StorageClass

<!-- Links -->

[1]: https://www.reddit.com/r/kubernetes/comments/q7sw24/a_local_maximum_on_bare_metal_k8s_storage_openebs/
