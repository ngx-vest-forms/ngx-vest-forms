export function isValidTimeFormat(time: string | undefined): boolean {
  if (!time) return false;
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
}

export function isFromEarlierThanTo(
  from: string | undefined,
  to: string | undefined,
): boolean {
  if (!from || !to) return false;
  return from < to;
}

type HourRange = { from?: string; to?: string };

export function isBusinessHoursOverlapping(
  hours: (HourRange | undefined)[] | undefined,
): boolean {
  if (!hours || hours.length < 2) {
    return false;
  }

  const sortedHours = hours
    .filter(
      (h): h is { from: string; to: string } =>
        !!h &&
        typeof h.from === 'string' &&
        typeof h.to === 'string' &&
        isValidTimeFormat(h.from) &&
        isValidTimeFormat(h.to),
    )
    .sort((a, b) => a.from.localeCompare(b.from));

  for (let index = 0; index < sortedHours.length - 1; index++) {
    if (sortedHours[index].to > sortedHours[index + 1].from) {
      return true; // Overlap detected
    }
  }

  return false;
}
