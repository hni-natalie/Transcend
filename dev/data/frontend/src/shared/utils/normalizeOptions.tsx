export function normalizeOptions(departments: string[]) {
  return departments.map(dept => ({
    value: dept.toLowerCase().replace(/\s+/g, '_'),
    label: dept
  }));
}