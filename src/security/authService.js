import jwt from "jsonwebtoken";
import { verifyPbkdf2Sha256 } from "./passwordHash.js";
import { buildSecurityContext } from "./securityContext.js";

export class AuthService {
  constructor({ usersConfig, policyService, jwtConfig }) {
    this.usersByUsername = new Map(usersConfig.users.map(u => [u.username, u]));
    this.policyService = policyService;
    this.jwtConfig = jwtConfig;
  }

  login({ username, password, device_id }) {
    const user = this.usersByUsername.get(username);
    if (!user || !user.is_active) return { ok: false };

    if (!verifyPbkdf2Sha256(password, user.password_hash)) return { ok: false };

    const ctx = buildSecurityContext(user);
    const vis = this.policyService.resolveVisibility(ctx);

    const claims = {
      sub: ctx.user_id,
      usr: ctx.username,
      roles: ctx.roles,
      clr: vis.effective_clearance,
      unit: ctx.unit,
      did: device_id
    };

    const token = jwt.sign(claims, this.jwtConfig.secret, {
      algorithm: "HS256",
      issuer: this.jwtConfig.issuer,
      audience: this.jwtConfig.audience,
      expiresIn: this.jwtConfig.expiresInSeconds
    });

    return {
      ok: true,
      access_token: token,
      expires_in: this.jwtConfig.expiresInSeconds,
      security_context: {
        user_id: ctx.user_id,
        roles: ctx.roles,
        clearance_level: vis.effective_clearance,
        allowed_entity_types: vis.allowed_entity_types,
        unit: ctx.unit
      }
    };
  }
}

