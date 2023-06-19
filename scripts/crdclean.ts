const yaml = require("yaml");
const fs = require("fs");

const crdDir = "source/crds";
const cleanCrdDir = `${crdDir}/clean`;
fs.mkdirSync(cleanCrdDir, { recursive: true });

fs.readdirSync("source/crds")
  .filter((filename) => filename.endsWith(".yaml"))
  .map((crdFile) => fs.readFileSync(`${crdDir}/${crdFile}`).toString())
  .forEach((crdYaml) => cleanAndDumpCrd(crdYaml));

function cleanAndDumpCrd(crdYaml) {
  yaml.parseAllDocuments(crdYaml).forEach((parsedKubeResource, i) => {
    const data = yaml.parse(parsedKubeResource.toString(), (k, v) => {
      return typeof v === "object" && k === "default" ? undefined : v;
    });

    if (data.kind === "CustomResourceDefinition") {
      fs.writeFileSync(
        `${cleanCrdDir}/${data.metadata.name}.yaml`,
        yaml.stringify(data)
      );
    }
  });
}
