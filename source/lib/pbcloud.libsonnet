local fluxcd = import 'github.com/jsonnet-libs/fluxcd-libsonnet/0.41.1/main.libsonnet';

local hr = fluxcd.helm.v2beta1.helmRelease;

{
  // Returns true if the pattern is contained within the string
  contains(pat, str): std.length(std.findSubstr(pat, str)) > 0,

  // Adds an extension to the given filename only if it does not already have it
  addExtension(filename, extension):
    local withExtension = if std.startsWith(extension, '.') then extension else '.' + extension;
    if std.endsWith(filename, withExtension) then filename else filename + withExtension,

  // Converts an object to a YAML document string, with unquoted keys
  toYaml(obj): std.manifestYamlDoc(obj, indent_array_in_object=false, quote_keys=false),

  // Builds a Flux HelmRelease object
  helmRelease(
    chartRepo,
    chart,
    namespace,
    name=chart,
    interval='24h',
    sourceRefNamespace='flux-system',
    values={},
  ):
    hr.new(name) +
    hr.metadata.withNamespace(namespace) +
    hr.spec.withInterval(interval) +
    hr.spec.chart.spec.withChart(chart) +
    hr.spec.chart.spec.sourceRef.withKind('HelmRepository') +
    hr.spec.chart.spec.sourceRef.withName(chartRepo) +
    hr.spec.chart.spec.sourceRef.withNamespace(sourceRefNamespace) +
    hr.spec.withValues(values),

  // Builds a standard Ingress block that is commonplace in Helm values files
  ingressValue(host, enabled=true, clusterIssuer='letsencrypt-production'): {
    enabled: true,
    annotations: {
      'cert-manager.io/cluster-issuer': clusterIssuer,
      'traefik.ingress.kubernetes.io/router.entrypoints': 'websecure',
    },
    hosts: [{
      host: host,
      paths: [{ path: '/', pathType: 'Prefix' }],
    }],
    tls: [{
      hosts: [host],
      // FIXME: Existing stuff is `<name>-tls`, this is a mildly breaking change
      secretName: host + '-tls',
    }],
  },

  // Renders a top level object of (name):(Kubernetes object) pairs into a YAML files.
  // Also builds a Kustomization containing each YAML filename by default.
  exportK8s(
    objectMap,
    enableKustomization=true,
  ):
    local objMap = objectMap {
      [if enableKustomization then 'kustomization']: {
        apiVersion: 'kustomize.config.k8s.io/v1beta1',
        kind: 'Kustomization',
        resources: [$.addExtension(name, 'yaml') for name in std.objectFields(objectMap)],
      },
    };
    {
      [$.addExtension(name, 'yaml')]: $.toYaml(objMap[name])
      for name in std.objectFields(objMap)
    },
}
