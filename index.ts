import * as namespaces from "./source/lib/namespaces";

new namespaces.certManager.Namespace(); // verified
new namespaces.externalDns.Namespace(); // verified
new namespaces.fluxSystem.Namespace();
new namespaces.gitea.Namespace(); // verified
new namespaces.media.Namespace(); // verified
new namespaces.monitoring.Namespace(); // verified
new namespaces.networking.Namespace(); // verified
new namespaces.unifi.Namespace(); // verified

// still need:
// - kube-system
// - rest of flux-system
