export async function requestNotificationPermission(): Promise<boolean> {
  return false;
}

export async function cancelAllScheduled(): Promise<void> {}

export async function schedulePrayerReminders(): Promise<void> {}

export async function scheduleSuppReminders(): Promise<void> {}

export async function scheduleHydrationReminders(): Promise<void> {}

export async function applyNotificationSettings(_settings: {
  prayer: boolean;
  supplements: boolean;
  hydration: boolean;
}): Promise<void> {}
