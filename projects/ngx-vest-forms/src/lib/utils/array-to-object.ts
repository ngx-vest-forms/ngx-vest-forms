export function arrayToObject<T>(arr: T[]): Record<number, T> {
  return arr.reduce((acc, value, index) => ({ ...acc, [index]: value }), {});
}
