const yaml = require("yaml");
const fs = require("fs");

const inFile = process.argv.length < 3 ? process.stdin.fd : process.argv[2];
const inCrdYaml = fs.readFileSync(inFile, "utf-8").toString();
const inCrd = yaml.parseDocument(inCrdYaml);

const outCrd = yaml.parse(inCrd.toString(), (k, v) => {
  return typeof v === "object" && k === "default" ? undefined : v;
});
const outCrdYaml = yaml.stringify(outCrd);
console.log(outCrdYaml);
