import { format, addDays, differenceInMinutes, parseISO, isWithinInterval } from "date-fns";

export function formatLocalTime(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "h:mm a");
}

export function formatLocalDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d, yyyy");
}

export function formatLocalDateTime(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MMM d, yyyy h:mm a");
}

export function getSearchWindow(startDate: Date, windowDays: number): { start: Date; end: Date } {
  return {
    start: startDate,
    end: addDays(startDate, windowDays),
  };
}

export function getDurationMinutes(start: string, end: string): number {
  return differenceInMinutes(parseISO(end), parseISO(start));
}

export function isWithinDaylightHours(
  start: string,
  end: string,
  twilightStart: string,
  twilightEnd: string
): boolean {
  const eventStart = parseISO(start);
  const eventEnd = parseISO(end);
  const dayStart = parseISO(twilightStart);
  const dayEnd = parseISO(twilightEnd);

  return (
    isWithinInterval(eventStart, { start: dayStart, end: dayEnd }) &&
    isWithinInterval(eventEnd, { start: dayStart, end: dayEnd })
  );
}

export function toLocalTimeString(utcDate: string, timeZoneOffset: number): string {
  const date = parseISO(utcDate);
  const localDate = new Date(date.getTime() + timeZoneOffset * 60 * 1000);
  return format(localDate, "yyyy-MM-dd'T'HH:mm");
}
