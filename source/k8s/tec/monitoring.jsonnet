local fluxcd = import 'github.com/jsonnet-libs/fluxcd-libsonnet/0.41.1/main.libsonnet';
local k8s = import 'github.com/jsonnet-libs/k8s-libsonnet/1.25/main.libsonnet';
local pbcloud = import 'pbcloud.libsonnet';

local ns = k8s.core.v1.namespace;
local hr = fluxcd.helm.v2beta1.helmRelease;

local namespace = 'monitoring';

local objects = {
  'kube-prometheus-stack': pbcloud.helmRelease(
    'prometheus-community',
    'kube-prometheus-stack',
    namespace,
    values={
      // FIXME: kube-prometheus-stack `paths` block is same level as `hosts`, this is not correct
      alertmanager: { ingress: pbcloud.ingressValue('alertmanager.${DOMAIN}') },
    }
  ),
};

pbcloud.exportK8s(objects)
