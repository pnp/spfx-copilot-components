export interface IGraphCollectionResponse<T> {
  '@odata.nextLink'?: string;
  value?: T[];
}

export interface IGraphMicrosoft365Group {
  description?: string;
  displayName?: string;
  groupTypes?: string[];
  id?: string;
  mail?: string;
}

export interface IGraphPlannerPlan {
  container?: {
    containerId?: string;
    type?: string;
    url?: string;
  };
  createdDateTime?: string;
  id?: string;
  owner?: string;
  title?: string;
}

export interface IGraphPlannerAssignment {
  assignedDateTime?: string;
}

export interface IGraphPlannerTask {
  assignments?: Record<string, IGraphPlannerAssignment>;
  bucketId?: string;
  completedDateTime?: string;
  createdDateTime?: string;
  dueDateTime?: string;
  id?: string;
  percentComplete?: number;
  planId?: string;
  startDateTime?: string;
  title?: string;
}

export interface IGraphPlannerBucket {
  id?: string;
  name?: string;
  planId?: string;
}