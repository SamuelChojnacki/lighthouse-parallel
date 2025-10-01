export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  total: number;
}

export interface CleanupResult {
  cleaned: number;
  stats: QueueStats;
}

export interface CleanupAllResult {
  cleaned: number;
  completedCleaned: number;
  failedCleaned: number;
  stats: QueueStats;
}
