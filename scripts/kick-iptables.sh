#!/usr/bin/env bash

# K8s services became unresponsive due to CoreDNS in the cluster not working at
# all. The links below seem to have more detail, and the script here pretty
# much fixed it. Unfortunately, this only fixes it very briefly...
#
# https://github.com/kubernetes-sigs/kubespray/issues/4674#issuecomment-507344468
# https://www.weave.works/blog/racy-conntrack-and-dns-lookup-timeouts

set -euo pipefail

# On the K8s host (sudo su)
iptables -P INPUT ACCEPT
iptables -P FORWARD ACCEPT
iptables -P OUTPUT ACCEPT
iptables -F

# From anywhere with K8s API access
kubectl get pod -n kube-system -l k8s-app=kube-dns -o name | xargs kubectl delete
