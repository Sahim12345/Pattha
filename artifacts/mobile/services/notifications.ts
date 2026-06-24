import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function cancelAllScheduled() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ── Prayer time reminders ──────────────────────────────────────────────
const PRAYER_SCHEDULE = [
  { name: 'Fajr', hour: 4, minute: 10 },
  { name: 'Dhuhr', hour: 13, minute: 12 },
  { name: 'Asr', hour: 16, minute: 58 },
  { name: 'Maghrib', hour: 21, minute: 26 },
  { name: 'Isha', hour: 23, minute: 10 },
];

export async function schedulePrayerReminders() {
  for (const p of PRAYER_SCHEDULE) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🕌 ${p.name} time`,
        body: 'Time to pray. Allahu Akbar.',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: p.hour,
        minute: p.minute,
      },
    });
  }
}

// ── Supplement reminders ──────────────────────────────────────────────
export async function scheduleSuppReminders() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '💊 Morning supplements',
      body: 'Time for your morning vitamins — Vitamin D3, Omega-3 & more.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 8,
      minute: 0,
    },
  });
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '💊 Evening supplements',
      body: 'Time for your evening supplements — Magnesium & Zinc.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  });
}

// ── Hydration reminders ──────────────────────────────────────────────
const HYDRATION_HOURS = [9, 11, 13, 15, 17, 19, 21];

export async function scheduleHydrationReminders() {
  for (const hour of HYDRATION_HOURS) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💧 Drink water',
        body: 'Stay hydrated! Log a glass in Pattha.',
        sound: false,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute: 0,
      },
    });
  }
}

// ── Master: schedule all enabled reminders ─────────────────────────────
export async function applyNotificationSettings(settings: {
  prayer: boolean;
  supplements: boolean;
  hydration: boolean;
}) {
  await cancelAllScheduled();
  if (settings.prayer) await schedulePrayerReminders();
  if (settings.supplements) await scheduleSuppReminders();
  if (settings.hydration) await scheduleHydrationReminders();
}
