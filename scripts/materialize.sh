#!/usr/bin/env bash

set -euo pipefail

cd "${GIT_ROOT}"

for f in $(fd . -e jsonnet source); do
  material="$(echo "${f}" | sed 's|^source|materialized|1' | sed 's|.jsonnet$||1')"
  mkdir -p "${material}"

  # --jpath <path> : Adds <path> to Jsonnet path for resolving imports
  # --string       : Manifest the output as plain text, since we're expecting YAML
  # --multi <path> : Render filenames specified by top level object keys to <path>
  jsonnet --jpath vendor --string --multi "${material}" "${f}"
done
