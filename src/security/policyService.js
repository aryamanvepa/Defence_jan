export class PolicyService {
  constructor(rolesConfig) {
    this.rolesConfig = rolesConfig;
  }

  resolveVisibility(ctx) {
    const roles = ctx.roles ?? [];
    const allowed = new Set();
    let cap = 10;

    for (const r of roles) {
      const def = this.rolesConfig.roles[r];
      if (!def) continue;
      def.allowed_entity_types.forEach(t => allowed.add(t));
      cap = Math.min(cap, def.max_clearance_cap);
    }

    const effectiveClearance = Math.min(ctx.clearance_level ?? 0, cap);

    return {
      allowed_entity_types: [...allowed],
      effective_clearance: effectiveClearance
    };
  }
}

