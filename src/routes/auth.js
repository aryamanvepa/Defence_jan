import express from "express";

export function makeAuthRouter({ authService, loginRequestValidator }) {
  const router = express.Router();

  router.post("/login", (req, res) => {
    if (!loginRequestValidator(req.body)) {
      return res.status(400).json({ error: "invalid_request", details: loginRequestValidator.errors });
    }

    const out = authService.login(req.body);
    if (!out.ok) return res.status(401).json({ error: "invalid_credentials" });

    return res.json({
      access_token: out.access_token,
      expires_in: out.expires_in,
      security_context: out.security_context
    });
  });

  return router;
}

