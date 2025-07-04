export function arrayToObject<T>(array: T[]): Record<number, T> {
  return Object.fromEntries(array.map((value, index) => [index, value]));
}
