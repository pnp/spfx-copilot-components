export type ExpertSkill = 'SPFx' | 'Copilot' | 'DB' | 'Spanish';

export interface Expert {
  readonly id: string;
  readonly displayName: string;
  readonly jobTitle: string;
  readonly skill: ExpertSkill;
  readonly shortCV: string;
  readonly department: string;
  readonly userPrincipalName?: string;
  readonly email?: string;
  readonly photoUrl?: string;
}

export interface ExpertPhoto {
  readonly url?: string;
  readonly loading: boolean;
}

export type ExpertPhotos = Readonly<Record<string, ExpertPhoto | undefined>>;
