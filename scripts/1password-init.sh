#!/usr/bin/env bash

set -euo pipefail

NS="1password"
SECRET="personal/nke7ubza2skerjsbkxem4rohha"

# Ensure we're signed in to 1Password CLI
eval "$(op signin)"

# Delete secrets if they exist
kubectl delete secret op-credentials --namespace="$NS" || true
kubectl delete secret onepassword-token --namespace="$NS" || true

# Pull from 1Password and push to Kubernetes secrets
op read "op://$SECRET/1password-credentials.json" |
  base64 --wrap=0 |
  kubectl create secret generic op-credentials --namespace="$NS" --from-file=1password-credentials.json=/dev/stdin
op read "op://$SECRET/credential" |
  kubectl create secret generic onepassword-token --namespace="$NS" --from-file=token=/dev/stdin

# Kill all pods in the namespace so they can come back with the proper secrets
kubectl delete pod --namespace="$NS" --all
