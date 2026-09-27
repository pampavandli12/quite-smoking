import { dbGetFirstAsync, dbRunAsync, dbTransactionAsync } from '@/db/client';
import { emitDataChange } from '@/services/dataEvents';
import { getRecoveryAnchor } from '@/services/milestoneService';
import { getActiveQuitPlan, listPlanWeeks } from '@/services/quitPlanService';
import type { MutationResult } from '@/services/types';
import {
  DAILY_CHECK_IN_ID,
  dailyCheckInIdsToCancel,
  idsWithPrefix,
  MILESTONE_ID_PREFIX,
  PLAN_WEEK_ID_PREFIX,
  upcomingMilestoneNotifications,
  upcomingPlanWeekNotifications,
  type PlannedNotification,
} from '@/utils/notificationSchedule';

type NotificationsModule = typeof import('expo-notifications');

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
    await cancelDailyCheckIn(Notifications);
    const [hour, minute] = time.split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_CHECK_IN_ID,
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

// Turns off the daily check-in only; milestone and plan reminders have their
// own settings.
export async function disableNotifications(): Promise<MutationResult> {
  try {
    const Notifications = await loadNotifications();
    await cancelDailyCheckIn(Notifications);
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

async function cancelIdentifiers(
  Notifications: NotificationsModule,
  identifiers: string[],
) {
  await Promise.all(
    identifiers.map((identifier) =>
      Notifications.cancelScheduledNotificationAsync(identifier),
    ),
  );
}

async function scheduledIdentifiers(Notifications: NotificationsModule) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.map((request) => request.identifier);
}

async function cancelDailyCheckIn(Notifications: NotificationsModule) {
  await cancelIdentifiers(
    Notifications,
    dailyCheckInIdsToCancel(await scheduledIdentifiers(Notifications)),
  );
}

// Milestone and plan reminders are opt-in. The table defaults their columns to
// 1, so they only count once the user has chosen them in Settings.
const OPT_IN_KEY = 'notification_kinds_opt_in';

export type ReminderKind = 'milestone' | 'plan';

export type ReminderSettings = { milestone: boolean; plan: boolean };

export async function getReminderSettings(): Promise<ReminderSettings> {
  const [preferences, optIn] = await Promise.all([
    getNotificationPreferences(),
    dbGetFirstAsync<{ value: string }>(
      `SELECT value FROM app_metadata WHERE key = ?`,
      [OPT_IN_KEY],
    ),
  ]);
  if (optIn?.value !== 'true' || !preferences) {
    return { milestone: false, plan: false };
  }
  return {
    milestone: preferences.milestoneEnabled === 1,
    plan: preferences.planRemindersEnabled === 1,
  };
}

export async function setReminderEnabled(
  kind: ReminderKind,
  enabled: boolean,
): Promise<MutationResult> {
  try {
    const Notifications = await loadNotifications();
    if (enabled) {
      const permission = await Notifications.requestPermissionsAsync();
      if (!permission.granted) {
        return { success: false, error: new Error('Notification permission denied.') };
      }
    }
    const current = await getReminderSettings();
    const next = { ...current, [kind]: enabled };
    await dbTransactionAsync(async (transaction) => {
      const now = Date.now();
      await transaction.runAsync(
        `INSERT INTO notification_preferences (
          id, milestone_enabled, plan_reminders_enabled, updated_at
         ) VALUES (1, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           milestone_enabled = excluded.milestone_enabled,
           plan_reminders_enabled = excluded.plan_reminders_enabled,
           updated_at = excluded.updated_at`,
        [next.milestone ? 1 : 0, next.plan ? 1 : 0, now],
      );
      await transaction.runAsync(
        `INSERT INTO app_metadata (key, value, updated_at) VALUES (?, 'true', ?)
         ON CONFLICT(key) DO UPDATE SET value = 'true', updated_at = excluded.updated_at`,
        [OPT_IN_KEY, now],
      );
    });
    emitDataChange('preferences');
    await rescheduleReminders({ force: true });
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error };
  }
}

async function replaceScheduled(
  Notifications: NotificationsModule,
  prefix: string,
  planned: PlannedNotification[],
) {
  await cancelIdentifiers(
    Notifications,
    idsWithPrefix(await scheduledIdentifiers(Notifications), prefix),
  );
  for (const item of planned) {
    await Notifications.scheduleNotificationAsync({
      identifier: item.identifier,
      content: { title: item.title, body: item.body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: item.date,
      },
    });
  }
}

// Best effort and safe to call often (Home focus, data changes). Never asks
// for permission and never touches the daily check-in. Without an opt-in it
// does nothing, so users who never enable reminders see no native calls;
// `force` is used after a toggle so turning one off clears it.
export async function rescheduleReminders({ force = false } = {}) {
  try {
    const settings = await getReminderSettings();
    if (!force && !settings.milestone && !settings.plan) return;
    const Notifications = await loadNotifications();
    const permission = await Notifications.getPermissionsAsync();
    const allowed = permission.granted;

    let milestones: PlannedNotification[] = [];
    if (allowed && settings.milestone) {
      const anchor = await getRecoveryAnchor();
      milestones = anchor ? upcomingMilestoneNotifications(anchor.since) : [];
    }
    await replaceScheduled(Notifications, MILESTONE_ID_PREFIX, milestones);

    let planWeeks: PlannedNotification[] = [];
    if (allowed && settings.plan) {
      const plan = await getActiveQuitPlan();
      if (plan?.status === 'active') {
        planWeeks = upcomingPlanWeekNotifications(await listPlanWeeks(plan.id));
      }
    }
    await replaceScheduled(Notifications, PLAN_WEEK_ID_PREFIX, planWeeks);
  } catch (error) {
    console.error('Error scheduling reminders:', error);
  }
}
