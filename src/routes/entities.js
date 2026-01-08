import express from "express";
import { ENTITIES } from "../domain/entities.js";

export function makeEntitiesRouter() {
  const router = express.Router();

  router.get("/", (req, res) => {
    const ctx = req.securityContext;
    const allowed = new Set(ctx.allowed_entity_types ?? []);
    const clearance = ctx.effective_clearance ?? 0;

    const visible = ENTITIES.filter(e => allowed.has(e.type) && clearance >= e.min_clearance);

    res.json({
      viewer: { user_id: ctx.user_id, roles: ctx.roles, clearance },
      entities: visible
    });
  });

  return router;
}

