local cm = import 'github.com/jsonnet-libs/cert-manager-libsonnet/1.11/main.libsonnet';
local k8s = import 'github.com/jsonnet-libs/k8s-libsonnet/1.25/main.libsonnet';
local pbcloud = import 'pbcloud.libsonnet';

local ns = k8s.core.v1.namespace;
local secret = k8s.core.v1.secret;
local clusterIssuer = cm.nogroup.v1.clusterIssuer;

local nsName = 'cert-manager';

local cmValues = {
  installCRDs: false,
  webhook: { enabled: true },
  extraArgs: [
    '--dns01-recursive-nameservers=1.1.1.1:53,9.9.9.9:53',
    '--dns01-recursive-nameservers-only',
  ],
  replicaCount: 1,
  podDnsPolicy: 'None',
  podDnsConfig: { nameservers: [
    '1.1.1.1',
    '9.9.9.9',
  ] },
};

local letsEncrypt(
  name, server
      ) = clusterIssuer.new(name) +
          clusterIssuer.spec.acme.withServer(server) +
          clusterIssuer.spec.acme.withEmail('${EMAIL}') +
          clusterIssuer.spec.acme.privateKeySecretRef.withName(name) { spec+: { acme+: {
            solvers: [
              clusterIssuer.spec.acme.solvers.dns01.cloudflare.withEmail('${EMAIL}') +
              clusterIssuer.spec.acme.solvers.dns01.cloudflare.apiKeySecretRef.withName('cloudflare-creds') +
              clusterIssuer.spec.acme.solvers.dns01.cloudflare.apiKeySecretRef.withKey('CF_API_KEY') +
              clusterIssuer.spec.acme.solvers.selector.withDnsZones(['${DOMAIN}']),
            ],
          } } };

pbcloud.exportK8s({
  namespace: ns.new(nsName),

  'helm-release': pbcloud.helmRelease('jetstack', 'cert-manager', nsName, values=cmValues),

  'cloudflare-creds': secret.new('cloudflare-creds', null) +
                      secret.metadata.withNamespace(nsName) +
                      secret.withStringData({ CF_API_KEY: '${CF_API_KEY}' }),

  'letsencrypt-production': letsEncrypt('letsencrypt-production', 'https://acme-v02.api.letsencrypt.org/directory'),

  'letsencrypt-staging': letsEncrypt('letsencrypt-staging', 'https://acme-staging-v02.api.letsencrypt.org/directory'),
})
