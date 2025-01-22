export const ENV = {
  TZ: "America/Los_Angeles",
  PUID: "1000",
  PGID: "100",
};

export const GLUETUN = {
  VPN_SERVICE_PROVIDER: "airvpn",
  VPN_TYPE: "wireguard",
  WIREGUARD_ADDRESSES: "10.184.150.109/32",
  SERVER_COUNTRIES: "Switzerland",
  FIREWALL_VPN_INPUT_PORTS: "21133",
  HEALTH_VPN_DURATION_INITIAL: "120s",
  PUBLICIP_API: "cloudflare",
};

export const HOST_PATHS = {
  downloads: { "/downloads": "/data/torrents" },
  tv: { "/tv": "/data/media/tv" },
  movies: { "/movies": "/data/media/movies" },
  audiobooks: { "/audiobooks": "/data/media/audiobooks" },
  music: { "/music": "/data/media/music" },
  youtube: { "/youtube": "/data/media/youtube" },
  recycleBin: { "/recycle-bin": "/data/media/recycle-bin" },
};
