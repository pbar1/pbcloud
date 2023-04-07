local fluxcd = import 'github.com/jsonnet-libs/fluxcd-libsonnet/0.41.1/main.libsonnet';
local k8s = import 'github.com/jsonnet-libs/k8s-libsonnet/1.25/main.libsonnet';
local pbcloud = import 'pbcloud.libsonnet';

local ns = k8s.core.v1.namespace;
local hr = fluxcd.helm.v2beta1.helmRelease;

local ns_name = 'media';

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
  cmIssuer='letsencrypt-production',
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
    config: {
      enabled: true,
      type: 'hostPath',
      hostPath: configHostPath,
      mountPath: configMountPath,
    },
  },
  ingress: {
    main: {
      enabled: true,
      annotations: {
        'cert-manager.io/cluster-issuer': cmIssuer,
        'traefik.ingress.kubernetes.io/router.entrypoints': 'websecure',
      },
      hosts: [{
        host: host,
        paths: [{ path: '/', pathType: 'Prefix' }],
      }],
      tls: [{
        hosts: [host],
        secretName: name + '-tls',
      }],
    },
  },
};


local helmRelease(name) = pbcloud.helmRelease('geek-cookbook', name, ns_name, values=values(name));

pbcloud.exportK8s({
  sonarr: helmRelease('sonarr'),
  radarr: helmRelease('radarr'),
})
