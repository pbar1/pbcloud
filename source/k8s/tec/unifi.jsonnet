local k8s = import 'github.com/jsonnet-libs/k8s-libsonnet/1.25/main.libsonnet';
local pbcloud = import 'pbcloud.libsonnet';

local ns = k8s.core.v1.namespace;

local nsName = 'unifi';

pbcloud.exportK8s({
  namespace: ns.new(nsName),

  'unifi-controller': pbcloud.helmRelease('geek-cookbook', 'unifi-controller', nsName, values={
    env: {
      TZ: 'America/Los_Angeles',
      UNIFI_GID: '100',
      UNIFI_UID: '1000',
    },
    hostNetwork: true,  // TODO: Investigate how to remove
    persistence: { data: {
      enabled: true,
      type: 'hostPath',
      hostPath: '/data/general/unifi',
      mountPath: '/unifi',
    } },
  }),
})
