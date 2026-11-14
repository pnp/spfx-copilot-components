declare interface ISharePointListsCopilotComponentStrings {
  ListsTitle: string;
  ExpandButtonLabel: string;
  BackButtonLabel: string;
  LoadingListsLabel: string;
  LoadingItemsLabel: string;
  NoListsMessage: string;
  NoItemsMessage: string;
  ItemCountLabel: string;
  SingleItemCountLabel: string;
  GenericErrorMessage: string;
}

declare module 'SharePointListsCopilotComponentStrings' {
  const strings: ISharePointListsCopilotComponentStrings;
  export = strings;
}
