import { dbGetFirstAsync, dbRunAsync } from '@/db/client';
import { emitDataChange } from '@/services/dataEvents';
import type { MutationResult } from '@/services/types';

export type NotificationPreferences = {
  enabled: number;
  dailyCheckInTime: string | null;
  milestoneEnabled: number;
  riskWindowEnabled: number;
  planRemindersEnabled: number;
};

async function loadNotifications() {
  try {
    return await import('expo-notifications');
  } catch (error) {
    throw new Error(
      'Notifications require a rebuilt development client.',
      { cause: error },
    );
  }
}

export function getNotificationPreferences() {
  return dbGetFirstAsync<NotificationPreferences>(
    `SELECT enabled, daily_check_in_time AS dailyCheckInTime,
       milestone_enabled AS milestoneEnabled,
       risk_window_enabled AS riskWindowEnabled,
       plan_reminders_enabled AS planRemindersEnabled
     FROM notification_preferences WHERE id = 1`,
  );
}

export async function enableDailyCheckIn(
  time: string,
): Promise<MutationResult> {
  try {
    const Notifications = await loadNotifications();
    const permission = await Notifications.requestPermissionsAsync();
    if (!permission.granted) {
      return { success: false, error: new Error('Notification permission denied.') };
    }
    await Notifications.cancelAllScheduledNotificationsAsync();
    const [hour, minute] = time.split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'A moment for yourself',
        body: 'Check in with your plan and notice how you are feeling.',
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
    });
    await dbRunAsync(
      `INSERT INTO notification_preferences (
        id, enabled, daily_check_in_time, updated_at
       ) VALUES (1, 1, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         enabled = 1, daily_check_in_time = excluded.daily_check_in_time,
         updated_at = excluded.updated_at`,
      [time, Date.now()],
    );
    emitDataChange('preferences');
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error };
  }
}

export async function disableNotifications(): Promise<MutationResult> {
  try {
    const Notifications = await loadNotifications();
    await Notifications.cancelAllScheduledNotificationsAsync();
    await dbRunAsync(
      `UPDATE notification_preferences SET enabled = 0, updated_at = ? WHERE id = 1`,
      [Date.now()],
    );
    emitDataChange('preferences');
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error };
  }
}
