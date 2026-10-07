/* Parameter schema helpers shared by every module. Everything an algorithm receives goes through normalize(). */
export const parseList = (s, numeric) => {
  const parts = String(s).split(/[\s,]+/).filter(Boolean);
  return numeric ? parts.map(Number).filter((x) => Number.isFinite(x)) : parts;
};

export const defaults = (schema) => Object.fromEntries(schema.map((p) => [p.key, p.def]));

export function normalize(schema, raw) {
  const v = {};
  schema.forEach((p) => {
    const r = raw[p.key];
    if (p.type === 'int') { let n = parseInt(r, 10); if (!Number.isFinite(n)) n = p.def; v[p.key] = Math.max(p.min, Math.min(p.max, n)); }
    else if (p.type === 'numlist') v[p.key] = parseList(r, true).slice(0, p.max || 12);
    else if (p.type === 'list') v[p.key] = parseList(r, false).slice(0, p.max || 12);
    else if (p.type === 'select') v[p.key] = p.options.some((o) => String(o.v) === String(r)) ? String(r) : String(p.def);
    else v[p.key] = String(r).slice(0, p.maxLen || 80);
  });
  return v;
}
