{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

    flake-utils.url = "github:numtide/flake-utils";

    cert-manager-libsonnet = { url = "github:jsonnet-libs/cert-manager-libsonnet"; flake = false; };
    crossplane-libsonnet = { url = "github:jsonnet-libs/crossplane-libsonnet"; flake = false; };
    fluxcd-libsonnet = { url = "github:jsonnet-libs/fluxcd-libsonnet"; flake = false; };
    k8s-libsonnet = { url = "github:jsonnet-libs/k8s-libsonnet"; flake = false; };
  };

  outputs = { self, nixpkgs, flake-utils, ... }@inputs:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = with pkgs; mkShell {
          buildInputs = [
            go-jsonnet
          ];
        };
      }
    );
}
