local k8s = import 'github.com/jsonnet-libs/k8s-libsonnet/1.25/main.libsonnet';
local pbcloud = import 'pbcloud.libsonnet';

local ns = k8s.core.v1.namespace;
local envVar = k8s.core.v1.envVar;
local ctr = k8s.core.v1.container;

local ns_name = 'media';
local mullvadPort = 55487;

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
  namespace: ns.new(ns_name),

  qbittorrent: helmRelease('qbittorrent') + { spec+: { values+: {
    persistence+: {
      downloads: hostPathPersistence('/data/torrents/qbittorrent', '/downloads/qbittorrent'),
    },
    env+: { QBT_TORRENTING_PORT: mullvadPort },
    secret+: { WIREGUARD_PRIVATE_KEY: '${MULLVAD_WG_PK}' },
    additionalContainers+: { gluetun: {
      image: 'qmcgaw/gluetun',
      securityContext: { capabilities: { add: ['NET_ADMIN'] } },
      envFrom: [{ secretRef: { name: 'qbittorrent' } }],
      env: [
        envVar.new('TZ', 'America/Los_Angeles'),
        envVar.new('VPN_SERVICE_PROVIDER', 'mullvad'),
        envVar.new('VPN_TYPE', 'wireguard'),
        envVar.new('WIREGUARD_ADDRESSES', '10.67.247.61/32'),
        envVar.new('SERVER_CITIES', 'Zurich'),
        envVar.new('OWNED_ONLY', 'yes'),
        envVar.new('FIREWALL_VPN_INPUT_PORTS', mullvadPort),
      ],
    } },
  } } },

  prowlarr: helmRelease('prowlarr'),

  sonarr: helmRelease('sonarr') + { spec+: { values+: { persistence+: {
    media: hostPathPersistence('/data/media/tv', '/tv'),
    downloads: hostPathPersistence('/data/torrents', '/downloads'),
  } } } },

  radarr: helmRelease('radarr') + { spec+: { values+: { persistence+: {
    media: hostPathPersistence('/data/media/movies', '/movies'),
    downloads: hostPathPersistence('/data/torrents', '/downloads'),
  } } } },

  // FIXME: readarr config is in /data/general/config/readar-audiobooks right now
  readarr: helmRelease('readarr') + { spec+: { values+: { persistence+: {
    media: hostPathPersistence('/data/media/audiobooks', '/audiobooks'),
    downloads: hostPathPersistence('/data/torrents', '/downloads'),
  } } } },

  bazarr: helmRelease('bazarr') + { spec+: { values+: { persistence+: {
    tv: hostPathPersistence('/data/media/tv', '/tv'),
    movies: hostPathPersistence('/data/media/movies', '/movies'),
  } } } },
})
