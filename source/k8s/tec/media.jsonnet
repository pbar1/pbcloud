local k8s = import 'github.com/jsonnet-libs/k8s-libsonnet/1.25/main.libsonnet';
local pbcloud = import 'pbcloud.libsonnet';

local ctr = k8s.core.v1.container;
local envFromSource = k8s.core.v1.envFromSource;
local ns = k8s.core.v1.namespace;

local ns_name = 'media';
local mullvadPort = '55487';

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

  ingress: { main: pbcloud.ingressValue(host, secretName=name + '-tls') },
};

local helmRelease(name) = pbcloud.helmRelease('geek-cookbook', name, ns_name, values=values(name));

pbcloud.exportK8s({
  namespace: ns.new(ns_name),

  qbittorrent: helmRelease('qbittorrent') + { spec+: { values+: {
    persistence+: {
      downloads: hostPathPersistence('/data/torrents/qbittorrent', '/downloads/qbittorrent'),
    },
    env+: {
      QBT_TORRENTING_PORT: mullvadPort,
    },
    secret+: {
      WIREGUARD_PRIVATE_KEY: '${MULLVAD_WG_PK}',
    },
    additionalContainers+: {
      gluetun: ctr.withImage('qmcgaw/gluetun') +
               ctr.securityContext.capabilities.withAdd(['NET_ADMIN']) +
               ctr.withEnvFrom(envFromSource.secretRef.withName('qbittorrent')) +
               ctr.withEnvMap({
                 TZ: 'America/Los_Angeles',
                 VPN_SERVICE_PROVIDER: 'mullvad',
                 VPN_TYPE: 'wireguard',
                 WIREGUARD_ADDRESSES: '10.67.247.61/32',
                 SERVER_CITIES: 'Zurich',
                 OWNED_ONLY: 'yes',
                 FIREWALL_VPN_INPUT_PORTS: mullvadPort,
                 // VPN health check failures take down port and breaks qBittorrent
                 // https://github.com/qdm12/gluetun/issues/1407
                 // FIXME: On qBittorrent restart, existing torrents may startup and
                 // connect to peers WITH A NON-VPN IP ADDRESS! Also, if a torrent is
                 // added after the restart, it may still stall. Due to timing issues
                 // the torrent port still needs to be kicked on the qBittorrent side.
                 HEALTH_VPN_DURATION_INITIAL: '120s',
               }),
    },
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

  plex: helmRelease('plex') + { spec+: { values+: {
    persistence+: {
      transcode: { enabled: true, type: 'emptyDir', medium: 'Memory' },
      tv: hostPathPersistence('/data/media/tv', '/tv'),
      movies: hostPathPersistence('/data/media/movies', '/movies'),
      audiobooks: hostPathPersistence('/data/media/audiobooks', '/audiobooks'),
    },
    podSecurityContext+: {
      // $ cat /etc/group | grep "video\|render"
      // video:x:26:
      // render:x:303:
      supplementalGroups: [26, 303],
      capabilities: null,
    },
    hostNetwork: true,
    ingress: null,
    // resources: { limits: { 'amd.com/gpu': 1 } },
  } } },
})
