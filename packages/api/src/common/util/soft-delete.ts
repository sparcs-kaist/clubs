export function activeOnly<TWhere extends object>(
  where: TWhere,
): TWhere & { deletedAt: null } {
  return { ...where, deletedAt: null };
}

export function onlyDeleted<TWhere extends object>(
  where: TWhere,
): TWhere & { deletedAt: { not: null } } {
  return { ...where, deletedAt: { not: null } };
}

export function withDeleted<TWhere extends object>(where: TWhere): TWhere {
  return where;
}
