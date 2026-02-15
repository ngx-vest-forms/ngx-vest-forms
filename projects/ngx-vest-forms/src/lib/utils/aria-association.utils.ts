export type AriaAssociationMode = 'all-controls' | 'single-control' | 'none';

/**
 * Splits an `aria-describedby` attribute value into normalized token IDs.
 */
export function parseAriaIdTokens(value: string | null): string[] {
  return (value ?? '')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

/**
 * Merges currently-active wrapper IDs into an existing `aria-describedby` value.
 *
 * Existing tokens owned by the wrapper are removed first, then current active IDs
 * are appended while preserving non-owned tokens and token uniqueness.
 */
export function mergeAriaDescribedBy(
  existing: string | null,
  activeIds: readonly string[],
  ownedIds: readonly string[]
): string | null {
  const ownedIdSet = new Set(ownedIds);
  const existingTokens = parseAriaIdTokens(existing);
  const existingWithoutOwned = existingTokens.filter(
    (token) => !ownedIdSet.has(token)
  );

  const merged: string[] = [...existingWithoutOwned];
  const mergedIdSet = new Set(merged);
  for (const id of activeIds) {
    if (!mergedIdSet.has(id)) {
      merged.push(id);
      mergedIdSet.add(id);
    }
  }

  return merged.length > 0 ? merged.join(' ') : null;
}

/**
 * Resolves control targets based on ARIA association mode.
 */
export function resolveAssociationTargets(
  controls: readonly HTMLElement[],
  mode: AriaAssociationMode
): HTMLElement[] {
  if (mode === 'none') {
    return [];
  }

  if (mode === 'single-control') {
    return controls.length === 1 ? [...controls] : [];
  }

  return [...controls];
}
