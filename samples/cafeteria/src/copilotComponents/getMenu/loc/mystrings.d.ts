declare interface IGetMenuCopilotComponentStrings {
  AppTitle: string;
  GreetingPrefix: string;
  ExpandButtonLabel: string;
}

declare module 'GetMenuCopilotComponentStrings' {
  const strings: IGetMenuCopilotComponentStrings;
  export = strings;
}
