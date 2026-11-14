export interface ICommunity {
  id: string;
  displayName: string | undefined;
  description: string | undefined;
  privacy: 'public' | 'private' | 'unknownFutureValue';
  groupId: string | undefined;
}

export interface ICommunitySnapshot {
  communities: ICommunity[];
  complete: boolean;
}
