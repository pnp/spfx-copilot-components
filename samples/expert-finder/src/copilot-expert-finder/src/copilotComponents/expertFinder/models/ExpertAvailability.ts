export type AvailabilityStatus = 'free' | 'tentative' | 'busy' | 'outOfOffice';

export interface AvailabilitySlot {
  readonly start: Date;
  readonly end: Date;
  readonly status: AvailabilityStatus;
}

export interface ExpertAvailability {
  readonly date: Date;
  readonly timeZone: string;
  readonly slots: readonly AvailabilitySlot[];
}
