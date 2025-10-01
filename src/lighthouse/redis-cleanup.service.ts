import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { LIGHTHOUSE_QUEUE } from '../config/queue.config';

@Injectable()
export class RedisCleanupService {
  private readonly logger = new Logger(RedisCleanupService.name);
  private readonly isEnabled: boolean;
  private readonly completedAgeHours: number;
  private readonly failedAgeHours: number;

  constructor(
    @InjectQueue(LIGHTHOUSE_QUEUE) private lighthouseQueue: Queue,
    private configService: ConfigService,
  ) {
    this.isEnabled = this.configService.get('REDIS_CLEANUP_ENABLED') === 'true';
    this.completedAgeHours = parseInt(
      this.configService.get('REDIS_CLEANUP_COMPLETED_AGE_HOURS') || '24',
      10,
    );
    this.failedAgeHours = parseInt(
      this.configService.get('REDIS_CLEANUP_FAILED_AGE_HOURS') || '48',
      10,
    );

    if (this.isEnabled) {
      this.logger.log(
        `Redis cleanup enabled - Completed jobs older than ${this.completedAgeHours}h, Failed jobs older than ${this.failedAgeHours}h`,
      );
    } else {
      this.logger.log('Redis cleanup disabled');
    }
  }

  // Exécute le nettoyage toutes les heures
  @Cron(CronExpression.EVERY_HOUR)
  async handleCleanup() {
    if (!this.isEnabled) {
      return;
    }

    try {
      const startTime = Date.now();
      this.logger.log('Starting Redis cleanup...');

      // Nettoyer les jobs terminés de plus de X heures
      const completedCount = await this.lighthouseQueue.clean(
        this.completedAgeHours * 60 * 60 * 1000, // Convertir en millisecondes
        100, // Limite de jobs à nettoyer par appel
        'completed',
      );

      // Nettoyer les jobs échoués de plus de X heures
      const failedCount = await this.lighthouseQueue.clean(
        this.failedAgeHours * 60 * 60 * 1000,
        100,
        'failed',
      );

      const duration = Date.now() - startTime;
      this.logger.log(
        `Redis cleanup completed in ${duration}ms - Removed: ${completedCount.length} completed, ${failedCount.length} failed jobs`,
      );
    } catch (error) {
      this.logger.error('Error during Redis cleanup:', error);
    }
  }

  // Méthode pour nettoyer manuellement
  async cleanupNow(): Promise<{
    completed: number;
    failed: number;
    duration: number;
  }> {
    const startTime = Date.now();

    const completedCount = await this.lighthouseQueue.clean(
      this.completedAgeHours * 60 * 60 * 1000,
      100,
      'completed',
    );

    const failedCount = await this.lighthouseQueue.clean(
      this.failedAgeHours * 60 * 60 * 1000,
      100,
      'failed',
    );

    const duration = Date.now() - startTime;

    return {
      completed: completedCount.length,
      failed: failedCount.length,
      duration,
    };
  }

  // Obtenir des stats sur les jobs stockés
  async getStorageStats() {
    const counts = await this.lighthouseQueue.getJobCounts(
      'completed',
      'failed',
      'delayed',
      'active',
      'waiting',
    );

    return {
      ...counts,
      cleanupConfig: {
        enabled: this.isEnabled,
        completedAgeHours: this.completedAgeHours,
        failedAgeHours: this.failedAgeHours,
      },
    };
  }
}
