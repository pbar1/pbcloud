local fluxcd = import 'github.com/jsonnet-libs/fluxcd-libsonnet/0.41.1/main.libsonnet';
local k8s = import 'github.com/jsonnet-libs/k8s-libsonnet/1.25/main.libsonnet';
local pbcloud = import 'pbcloud.libsonnet';

local ns = k8s.core.v1.namespace;
local hr = fluxcd.helm.v2beta1.helmRelease;

local ns_name = 'media';

local hostPathPersistence(hostPath, mountPath, enabled=true) = {
  enabled: true,
  type: 'hostPath',
  hostPath: hostPath,
  mountPath: mountPath,
};

local values(
  name,
  repository='ghcr.io/linuxserver/' + name,
  tag='latest',
  imagePullPolicy='Always',
  tz='America/Los_Angeles',
  puid=1000,
  pgid=100,
  configHostPath='/data/general/config/' + name,
  configMountPath='/config',
      ) = {
  local host = name + '.${DOMAIN}',

  image: {
    repository: repository,
    tag: tag,
    imagePullPolicy: imagePullPolicy,
  },

  env: {
    TZ: tz,
    PUID: puid,
    PGID: pgid,
  },

  podAnnotations: {
    ['container.apparmor.security.beta.kubernetes.io/' + name]: 'unconfined',
  },

  podSecurityContext: {
    fsGroup: pgid,
    fsGroupChangePolicy: 'OnRootMismatch',
    capabilities: { drop: ['all'] },
    seccompProfile: { type: 'RuntimeDefault' },
  },

  persistence: {
    config: hostPathPersistence(configHostPath, configMountPath),
  },

  ingress: { main: pbcloud.ingressValue(host) },
};

local helmRelease(name) = pbcloud.helmRelease('geek-cookbook', name, ns_name, values=values(name));

pbcloud.exportK8s({
  sonarr: helmRelease('sonarr') + { spec+: { values+: { persistence+: {
    media: hostPathPersistence('/data/media/tv', '/tv'),
    downloads: hostPathPersistence('/data/torrents', '/downloads'),
  } } } },

  radarr: helmRelease('radarr') + { spec+: { values+: { persistence+: {
    media: hostPathPersistence('/data/media/movies', '/movies'),
    downloads: hostPathPersistence('/data/torrents', '/downloads'),
  } } } },
})
