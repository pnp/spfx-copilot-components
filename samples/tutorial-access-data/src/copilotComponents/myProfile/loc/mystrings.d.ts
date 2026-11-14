declare interface IMyProfileCopilotComponentStrings {
  ProfileTitle: string;
  ExpandButtonLabel: string;
  MailTabLabel: string;
  CalendarTabLabel: string;
  LoadingProfileLabel: string;
  LoadingMailLabel: string;
  LoadingCalendarLabel: string;
  NoMessagesMessage: string;
  NoEventsMessage: string;
  PermissionMessage: string;
  GenericErrorMessage: string;
}

declare module 'MyProfileCopilotComponentStrings' {
  const strings: IMyProfileCopilotComponentStrings;
  export = strings;
}
