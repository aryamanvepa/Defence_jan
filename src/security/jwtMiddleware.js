import jwt from "jsonwebtoken";

export function jwtAuth({ jwtConfig, policyService }) {
  return function (req, res, next) {
    const hdr = req.headers.authorization;
    if (!hdr?.startsWith("Bearer ")) return res.status(401).json({ error: "missing_bearer_token" });

    const token = hdr.slice("Bearer ".length);

    try {
      const decoded = jwt.verify(token, jwtConfig.secret, {
        algorithms: ["HS256"],
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience
      });

      const ctx = {
        user_id: decoded.sub,
        username: decoded.usr,
        roles: decoded.roles ?? [],
        clearance_level: decoded.clr ?? 0,
        unit: decoded.unit ?? null,
        device_id: decoded.did ?? null
      };

      const vis = policyService.resolveVisibility(ctx);
      req.securityContext = Object.freeze({
        ...ctx,
        allowed_entity_types: vis.allowed_entity_types,
        effective_clearance: vis.effective_clearance
      });

      next();
    } catch {
      return res.status(401).json({ error: "invalid_token" });
    }
  };
}

