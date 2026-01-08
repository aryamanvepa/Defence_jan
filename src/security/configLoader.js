import fs from "fs";
import path from "path";
import Ajv from "ajv";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export function loadAndValidateConfig({ configPath, schemaPath }) {
  const config = readJson(configPath);
  const schema = readJson(schemaPath);

  const ajv = new Ajv({ allErrors: true, strict: true });
  const validate = ajv.compile(schema);

  if (!validate(config)) {
    const msg = (validate.errors ?? [])
      .map(e => `${e.instancePath} ${e.message}`)
      .join("; ");
    throw new Error(`Config validation failed for ${path.basename(configPath)}: ${msg}`);
  }
  return config;
}

