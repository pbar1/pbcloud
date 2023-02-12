# pbcloud

TODO: Materialize cluster YAML via Jsonnet (maybe)

FIXME: Major problems with SOPS decryption not working in "many-ks" structure
- Might have to reneg on the .bootstrap strategy
- CRDs are installed via `gotk-compoments.yaml` via kubectl
- GitRepository and Kustomization are installed via `gotk-sync.yaml` via kubectl
