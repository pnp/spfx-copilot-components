import type { Weekday } from "./enums"

/** A single day's opening window, e.g. ["08:00", "19:00"]; absent/undefined means closed all day. */
export type IDayHours = [string, string] | undefined

export type IWeeklyHours = Record<Weekday, IDayHours>
