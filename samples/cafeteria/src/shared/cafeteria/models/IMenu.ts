import type { MenuStatus } from "./enums"

export interface IMenu {
  id: string
  cafeteriaId: string
  /** ISO date, YYYY-MM-DD. */
  menuDate: string
  status: MenuStatus
  publishedBy?: string
  /** ISO date-time. */
  publishedOn?: string
}
