declare interface IStarMatchCopilotComponentStrings {
  GameTitle: string;
  GameInstructions: string;
  ExpandButtonLabel: string;
  CompactButtonLabel: string;
  PlayAgainButtonLabel: string;
  ShareResultButtonLabel: string;
  TimeLeftLabel: string;
  StarsLabel: string;
  SelectedLabel: string;
  NumbersLeftLabel: string;
  WinTitle: string;
  WinMessage: string;
  LoseTitle: string;
  LoseMessage: string;
  ShareWinMessage: string;
  ShareLoseMessage: string;
}

declare module 'StarMatchCopilotComponentStrings' {
  const strings: IStarMatchCopilotComponentStrings;
  export = strings;
}
