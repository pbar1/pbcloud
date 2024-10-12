export const ENV = {
  TZ: "America/Los_Angeles",
  PUID: "1000",
  PGID: "100",
};

export const GLUETUN = {
  VPN_SERVICE_PROVIDER: "airvpn",
  VPN_TYPE: "wireguard",
  WIREGUARD_ADDRESSES:
    "10.184.150.109/32,fd7d:76ee:e68f:a993:38c6:c8f3:5d35:8c9/128",
  SERVER_COUNTRIES: "Switzerland",
  FIREWALL_VPN_INPUT_PORTS: "21133",
  HEALTH_VPN_DURATION_INITIAL: "120s",
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
