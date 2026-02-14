export type AriaAssociationMode = 'all-controls' | 'single-control' | 'none';

export function parseAriaIdTokens(value: string | null): string[] {
  return (value ?? '')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function mergeAriaDescribedBy(
  existing: string | null,
  activeIds: string[],
  ownedIds: string[]
): string | null {
  const existingTokens = parseAriaIdTokens(existing);
  const existingWithoutOwned = existingTokens.filter(
    (token) => !ownedIds.includes(token)
  );

  const merged: string[] = [...existingWithoutOwned];
  for (const id of activeIds) {
    if (!merged.includes(id)) {
      merged.push(id);
    }
  }

  return merged.length > 0 ? merged.join(' ') : null;
}

export function resolveAssociationTargets(
  controls: HTMLElement[],
  mode: AriaAssociationMode
): HTMLElement[] {
  if (mode === 'single-control') {
    return controls.length === 1 ? controls : [];
  }

  return controls;
}
