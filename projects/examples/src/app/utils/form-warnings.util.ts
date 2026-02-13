/**
 * Converts the FormDirective's `fieldWarnings` Map into a plain Record
 * suitable for passing to presentational components.
 */
export function mapWarningsToRecord(
  warningEntries: Map<string, readonly string[]>
): Record<string, string[]> {
  const warnings: Record<string, string[]> = {};
  for (const [field, messages] of warningEntries.entries()) {
    warnings[field] = [...messages];
  }
  return warnings;
}
