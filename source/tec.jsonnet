local fluxcd = import 'github.com/jsonnet-libs/fluxcd-libsonnet/0.41.1/main.libsonnet';
local k8s = import 'github.com/jsonnet-libs/k8s-libsonnet/1.25/main.libsonnet';

local helmrepo = fluxcd.source.v1beta2.helmRepository;

local strContains(pat, str) = std.length(std.findSubstr(pat, str)) > 0;
local toYaml(obj) = std.manifestYamlDoc(obj, indent_array_in_object=false, quote_keys=false);

local repos = {
  'amd-gpu': 'https://radeonopencompute.github.io/k8s-device-plugin',
  'external-dns': 'https://kubernetes-sigs.github.io/external-dns',
  'geek-cookbook': 'https://geek-cookbook.github.io/charts',
  gitea: 'https://dl.gitea.io/charts/',
  grafana: 'https://grafana.github.io/helm-charts',
  jetstack: 'https://charts.jetstack.io',
  mvisonneau: 'https://charts.visonneau.fr',
  'prometheus-community': 'https://prometheus-community.github.io/helm-charts',
  weaveworks: 'oci://ghcr.io/weaveworks/charts',
};

local repo_map = {
  [name]: helmrepo.new(name) +
          helmrepo.metadata.withNamespace('flux-system') +
          helmrepo.spec.withUrl(repos[name]) +
          helmrepo.spec.withInterval('24h') +
          (if strContains('oci://', repos[name]) then helmrepo.spec.withType('oci') else {})
  for name in std.objectFields(repos)
};

local make_kustomize_dir(obj_map) =
  local kustomization = {
    apiVersion: 'kustomize.config.k8s.io/v1beta1',
    kind: 'Kustomization',
    resources: [file + '.yaml' for file in std.objectFields(obj_map)],
  };
  { 'kustomization.yaml': toYaml(kustomization) } + {
    [name + '.yaml']: toYaml(obj_map[name])
    for name in std.objectFields(obj_map)
  };

// To render, run from git root:
// jsonnet --jpath vendor --string --multi source <this file>
make_kustomize_dir(repo_map)
