import express from "express";
import Ajv from "ajv";
import fs from "fs";
import path from "path";

import { loadAndValidateConfig } from "./security/configLoader.js";
import { PolicyService } from "./security/policyService.js";
import { AuthService } from "./security/authService.js";
import { jwtAuth } from "./security/jwtMiddleware.js";
import { makeAuthRouter } from "./routes/auth.js";
import { makeEntitiesRouter } from "./routes/entities.js";

const PORT = parseInt(process.env.TRIVI_PORT ?? "8080", 10);

const jwtConfig = {
  issuer: process.env.TRIVI_JWT_ISSUER ?? "trivikrama",
  audience: process.env.TRIVI_JWT_AUDIENCE ?? "trivikrama-clients",
  secret: process.env.TRIVI_JWT_SECRET ?? "replace-me",
  expiresInSeconds: 15 * 60
};

// Fail-fast config validation at startup
const usersConfig = loadAndValidateConfig({
  configPath: path.resolve("config/auth/users.json"),
  schemaPath: path.resolve("schemas/auth/users.schema.json")
});

const rolesConfig = loadAndValidateConfig({
  configPath: path.resolve("config/auth/roles.json"),
  schemaPath: path.resolve("schemas/auth/roles.schema.json")
});

const policyService = new PolicyService(rolesConfig);
const authService = new AuthService({ usersConfig, policyService, jwtConfig });

// Login request schema validator
const ajv = new Ajv({ allErrors: true, strict: true });
const loginSchema = JSON.parse(fs.readFileSync("schemas/auth/login_request.schema.json", "utf-8"));
const loginRequestValidator = ajv.compile(loginSchema);

const app = express();
app.use(express.json({ limit: "256kb" }));

app.get("/health", (_, res) => res.json({ ok: true }));

app.use("/auth", makeAuthRouter({ authService, loginRequestValidator }));
app.use("/entities", jwtAuth({ jwtConfig, policyService }), makeEntitiesRouter());

app.listen(PORT, () => console.log(`[TRIVI] Auth slice listening on :${PORT}`));

