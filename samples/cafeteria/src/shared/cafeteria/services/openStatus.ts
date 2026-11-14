import type { ICafeteria, Weekday } from "../models"

export interface IOpenStatus {
  isOpen: boolean
  /** Present when a closure notice/override applies, taking precedence over computed hours. */
  closureNotice?: string
  /** Today's opening window in the cafeteria's own time zone, if any. */
  todayHours?: [string, string]
}

function partsInZone(date: Date, timeZone: string): { weekday: Weekday; hhmm: string } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
  const parts = formatter.formatToParts(date)
  const weekdayShort = parts.find((p) => p.type === "weekday")?.value ?? "Mon"
  let hour = parts.find((p) => p.type === "hour")?.value ?? "00"
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00"
  if (hour === "24") hour = "00"

  const weekdayMap: Record<string, Weekday> = {
    Mon: "mon",
    Tue: "tue",
    Wed: "wed",
    Thu: "thu",
    Fri: "fri",
    Sat: "sat",
    Sun: "sun",
  }

  return {
    weekday: weekdayMap[weekdayShort] ?? "mon",
    hhmm: `${hour}:${minute}`,
  }
}

function dateOnlyInZone(date: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone })
  return formatter.format(date)
}

/**
 * Computes open/closed status against the cafeteria's own IANA time zone (BRD risk R8),
 * never the viewer's local zone. A closure notice/until override always wins.
 */
export function getOpenStatus(cafeteria: ICafeteria, now: Date = new Date()): IOpenStatus {
  if (cafeteria.closureNotice && cafeteria.closureUntil) {
    const todayInZone = dateOnlyInZone(now, cafeteria.timeZone)
    if (todayInZone <= cafeteria.closureUntil) {
      return { isOpen: false, closureNotice: cafeteria.closureNotice }
    }
  }

  const { weekday, hhmm } = partsInZone(now, cafeteria.timeZone)
  const hours = cafeteria.openingHours[weekday]

  if (!hours) {
    return { isOpen: false }
  }

  const [open, close] = hours
  const isOpen = hhmm >= open && hhmm < close

  return { isOpen, todayHours: hours }
}

export function todayIsoDateInZone(timeZone: string, now: Date = new Date()): string {
  return dateOnlyInZone(now, timeZone)
}

export function todayWeekdayInZone(timeZone: string, now: Date = new Date()): Weekday {
  return partsInZone(now, timeZone).weekday
}
