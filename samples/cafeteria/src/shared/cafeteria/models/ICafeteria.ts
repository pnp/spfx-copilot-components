import type { CuisineTag, PaymentMethod } from "./enums"
import type { IWeeklyHours } from "./IWeeklyHours"

export interface ICafeteria {
  id: string
  title: string
  building: string
  floor: string
  capacity?: number
  cuisineTags: CuisineTag[]
  openingHours: IWeeklyHours
  /** IANA time zone, e.g. "Asia/Kolkata" — open status is computed against this, not the viewer's local zone (BRD risk R8). */
  timeZone: string
  contactEmail: string
  paymentMethods: PaymentMethod[]
  /** Free-text override; when set together with closureUntil, it takes precedence over computed open status. */
  closureNotice?: string
  /** ISO date (YYYY-MM-DD); the closure notice applies through end of this day. */
  closureUntil?: string
  isActive: boolean
  imageUrl?: string
}
