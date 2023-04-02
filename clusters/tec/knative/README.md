# Knative

Currently installed via the `kn` CLI and it's `kn-operator` plugin.

### Commands

1. `kn operator install -n knative-operator`
2. `kn operator install -n knative-serving --component serving --kourier`
3. `kn operator install -n knative-eventing --component eventing`

### Notes

Without passing `--kourier` when installing `serving`, Istio will be assumed by
default. Since it's not installed, this never succeeds. Had to abort the
installation of `serving`, clean up the namespace, and then redo with the
Kourier flag passed.

TODO: Can I ditch Traefik and just use Kourier even for standalone ingress?
TODO: If not, fix Kourier LB port to not conflict with Traefik
TODO: Open up port-forward to Kourier 443
TODO: Automatic redirect 80->443
TODO: Looked like Knative has a Cert-Manager integration?
