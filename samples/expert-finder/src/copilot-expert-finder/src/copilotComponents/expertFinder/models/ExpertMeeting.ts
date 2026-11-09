export interface MeetingOrganizer {
  readonly displayName: string;
  readonly email: string;
  readonly userPrincipalName: string;
}

export interface CreatedMeeting {
  readonly id: string;
  readonly teamsJoinUrl?: string;
  readonly outlookUrl?: string;
}
