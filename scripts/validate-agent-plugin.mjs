import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
// Official Agent Plugins 1.0 schema: https://agent-plugins.org/schemas/1.0.0/plugin.schema.json
const schema = JSON.parse(
  readFileSync(join(root, "schemas/agent-plugins/1.0.0/plugin.schema.json"), "utf8")
);
const validate = new Ajv2020({ allErrors: true }).compile(schema);

export function validateAgentPlugin(manifest) {
  if (validate(manifest)) return;

  const errors = validate.errors.map(({ instancePath, message, params }) => {
    const path = instancePath || "/";
    const extra = params.additionalProperty ?? params.missingProperty;
    return `  ${path}${extra ? `/${extra}` : ""} ${message}`;
  });
  throw new Error(`Invalid Agent Plugins 1.0 plugin.json:\n${errors.join("\n")}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  validateAgentPlugin(JSON.parse(readFileSync(join(root, "plugin.json"), "utf8")));
  console.log("Agent Plugins 1.0 plugin.json is valid");
}
