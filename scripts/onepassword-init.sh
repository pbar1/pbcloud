#!/usr/bin/env bash

set -euo pipefail

NS="onepassword"
SECRET="personal/nke7ubza2skerjsbkxem4rohha"

# Ensure we're signed in to 1Password CLI
eval "$(op signin)"

# Ensure namespace exists
kubectl create namespace "$NS" --dry-run=client --output=yaml | kubectl apply -f -

# Delete secrets if they exist
kubectl delete secret op-credentials --namespace="$NS" || true
kubectl delete secret onepassword-token --namespace="$NS" || true

# Pull from 1Password and push to Kubernetes secrets

# K8s secrets are base64 encoded. However, the contents of the secret's key
# `1password-credentials.json` are ALSO expected to be base64 encoded (with no
# wrapping, hence the --wrap=0) instead of being raw JSON text. In other words,
# this secret is double-base64 encoded...which is somewhat confusing
#
# This secret is used by the 1Password Connect sync/api pod to establish a
# bridge with 1Password itself - it does NOT authenticate the user
op read "op://$SECRET/1password-credentials.json" |
    base64 --wrap=0 |
    kubectl create secret generic op-credentials --namespace="$NS" --from-file=1password-credentials.json=/dev/stdin

# Token is very sensitive to existence of newline similar to this issue:
# https://github.com/stashed/stash/issues/547
#
# This secret is used to authenticate the user to 1Password
kubectl create secret generic onepassword-token --namespace="$NS" --from-literal=token="$(op read "op://$SECRET/credential")"

# Kill all pods in the namespace so they can come back with the proper secrets
kubectl delete pod --namespace="$NS" --all
