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
 * The IDs of the error, warning and pending regions that one element renders.
 *
 * The element that renders the messages owns these IDs (a wrapper, or
 * `FormErrorControlDirective` when a custom template renders them).
 */
export type MessageRegionIds = {
  readonly errorId: string;
  readonly warningId: string;
  readonly pendingId: string;
};

/** Which message regions are currently rendered. */
export type VisibleMessageRegions = {
  readonly errors: boolean;
  readonly warnings: boolean;
  readonly pending: boolean;
};

/**
 * Builds the `aria-describedby` value for the message regions that are
 * currently rendered, in error, warning, pending order, or `null` when none is.
 */
export function buildMessageDescribedBy(
  ids: MessageRegionIds,
  visible: VisibleMessageRegions
): string | null {
  const active: string[] = [];
  if (visible.errors) {
    active.push(ids.errorId);
  }
  if (visible.warnings) {
    active.push(ids.warningId);
  }
  if (visible.pending) {
    active.push(ids.pendingId);
  }
  return active.length > 0 ? active.join(' ') : null;
}

/**
 * All message region IDs, for {@link mergeAriaDescribedBy}'s `ownedIds`:
 * the tokens the owner may remove from a control's `aria-describedby`.
 */
export function messageRegionIdList(ids: MessageRegionIds): string[] {
  return [ids.errorId, ids.warningId, ids.pendingId];
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
