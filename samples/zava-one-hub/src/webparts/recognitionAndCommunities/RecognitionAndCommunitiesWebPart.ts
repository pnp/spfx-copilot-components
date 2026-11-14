import { ZavaOneWebPartBase, type IZavaOneWebPartProperties } from '../../shared/hosts/ZavaOneWebPartBase';

export interface IRecognitionAndCommunitiesWebPartProps extends IZavaOneWebPartProperties {}

export default class RecognitionAndCommunitiesWebPart extends ZavaOneWebPartBase<IRecognitionAndCommunitiesWebPartProps> {
  protected readonly intent = 'recognition' as const;
}
