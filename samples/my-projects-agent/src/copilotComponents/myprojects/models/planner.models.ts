export interface IPlannerPlan {
  createdDateTime?: string;
  id: string;
  owner: string;
  title: string;
}

export interface IPlannerTask {
  assignedToCurrentUser: boolean;
  assignmentDateTimes: string[];
  bucketId: string;
  completedDateTime?: string;
  createdDateTime?: string;
  dueDateTime?: string;
  id: string;
  percentComplete: number;
  planId: string;
  startDateTime?: string;
  title: string;
}

export interface IPlannerBucket {
  id: string;
  name: string;
  planId: string;
}

export interface IPlannerProjectData {
  buckets: IPlannerBucket[];
  plan: IPlannerPlan;
  tasks: IPlannerTask[];
}

export interface IPlannerProjectSummary extends IPlannerPlan {
  activeTasks: number;
  assignedToMeTasks: number;
  completedTasks: number;
  lastActivityDateTime?: string;
  nextDueDate?: string;
  onHoldTaskIds: string[];
  onHoldTasks: number;
  overdueTasks: number;
  tasks: IPlannerTask[];
  totalTasks: number;
  urgentTasks: number;
}

export interface IPlannerDateBounds {
  endExclusive: number;
  start: number;
}