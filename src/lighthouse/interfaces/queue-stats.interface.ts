export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  total: number;
}

export interface CleanupAllResult {
  cleaned: number;
  completedCleaned: number;
  failedCleaned: number;
  stats: QueueStats;
}
