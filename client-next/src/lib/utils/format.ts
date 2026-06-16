export function titleCaseCity(name?: string) {
  if (!name) return "City";
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function formatShortDate(d?: string) {
  const dt = d ? new Date(d) : new Date();
  return dt.toLocaleDateString();
}

export function pretty(s?: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}
