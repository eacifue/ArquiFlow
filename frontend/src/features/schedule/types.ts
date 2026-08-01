export type ScheduleTaskStatus = "NotStarted" | "InProgress" | "Done" | "Delayed";

export interface ScheduleTask {
  id: string;
  projectId: string;
  name: string;
  startDate: string;
  endDate: string;
  progressPercent: number;
  status: ScheduleTaskStatus;
  sortOrder: number;
}

export interface ScheduleTaskFormInput {
  name: string;
  startDate: string;
  endDate: string;
  sortOrder: number;
}

export interface UpdateScheduleTaskInput extends ScheduleTaskFormInput {
  progressPercent: number;
}

export interface UpdateScheduleRequest {
  startDate: string;
  endDate: string;
  progressPercent: number;
}
