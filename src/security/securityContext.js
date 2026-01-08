export function buildSecurityContext(user) {
  return {
    user_id: user.user_id,
    username: user.username,
    roles: user.roles,
    clearance_level: user.clearance_level,
    unit: user.unit ?? null
  };
}

