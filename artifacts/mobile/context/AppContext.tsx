import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { BUILTIN_ITEMS } from '@/data/items';
import { DayPlan, generateMealPlan } from '@/data/mealGenerator';

export type CustomItem = {
  id: string;
  name: string;
  defaultPrice: number;
  storeKey: string;
  category: string;
};

export type SavingsGoal = {
  name: string;
  emoji: string;
  target: number;
};

export type MoodEntry = {
  date: string;
  rating: number;
  note: string;
};

export type Transaction = {
  id: string;
  name: string;
  amount: number;
  category: string;
  storeKey: string;
  date: string;
  week: number;
  type: 'shopping' | 'quick';
};

export type RecurringExpense = {
  id: string;
  name: string;
  icon: string;
  amount: number;
  dueDay: number;
  category: string;
  paid: Record<string, boolean>;
};

type AppData = {
  monthlyBudget: number;
  rolloverEnabled: boolean;
  checks: Record<string, boolean>;
  prices: Record<string, number>;
  names: Record<string, string>;
  stores: Record<string, string>;
  custom: Record<string, CustomItem[]>;
  removed: Record<string, string[]>;
  goal: SavingsGoal | null;
  mealCooked: Record<string, boolean>;
  generatedMeals: Record<string, DayPlan[]>;
  suppTaken: Record<string, boolean>;
  suppDate: string;
  suppStreak: number;
  lastSuppDate: string;
  hydration: { count: number; date: string };
  weight: number | null;
  height: number | null;
  moods: MoodEntry[];
  transactions: Transaction[];
  recurringExpenses: RecurringExpense[];
};

type AppContextType = {
  data: AppData;
  weeklyBudget: number;
  tickItem: (id: string) => void;
  setItemPrice: (id: string, price: number) => void;
  setItemName: (id: string, name: string) => void;
  setItemStore: (id: string, storeKey: string) => void;
  addCustomItem: (week: number, item: Omit<CustomItem, 'id'>) => void;
  removeItem: (week: number, id: string) => void;
  checkAllWeek: (week: number) => void;
  uncheckAllWeek: (week: number) => void;
  resetWeek: (week: number) => void;
  clearAll: () => void;
  setMonthlyBudget: (budget: number) => void;
  setGoal: (goal: SavingsGoal | null) => void;
  generateMeals: (week: number) => void;
  toggleMealCooked: (key: string) => void;
  takeSupplement: (id: string) => void;
  resetSupplements: () => void;
  addWater: () => void;
  removeWater: () => void;
  setWeight: (w: number | null) => void;
  setHeight: (h: number | null) => void;
  addMood: (mood: MoodEntry) => void;
  addQuickExpense: (name: string, amount: number, category: string) => void;
  removeTransaction: (id: string) => void;
  addRecurringExpense: (expense: Omit<RecurringExpense, 'id' | 'paid'>) => void;
  updateRecurringExpense: (id: string, expense: Partial<Omit<RecurringExpense, 'id'>>) => void;
  removeRecurringExpense: (id: string) => void;
  toggleRecurringPaid: (id: string, monthKey: string) => void;
  setRolloverEnabled: (enabled: boolean) => void;
  getWeekSpent: (week: number) => number;
  getEffectiveWeeklyBudget: (week: number) => number;
  effectiveWeekBudgets: number[];
  getAllItems: (week: number) => { cat: string; items: { id: string; name: string; defaultPrice: number; storeKey: string }[] }[];
  getCategorySpending: () => { category: string; amount: number }[];
};

const STORAGE_KEY = 'pattha_data_v3';

const DEFAULT_DATA: AppData = {
  monthlyBudget: 100,
  rolloverEnabled: false,
  checks: {},
  prices: {},
  names: {},
  stores: {},
  custom: { '1': [], '2': [], '3': [], '4': [] },
  removed: { '1': [], '2': [], '3': [], '4': [] },
  goal: null,
  mealCooked: {},
  generatedMeals: {},
  suppTaken: {},
  suppDate: '',
  suppStreak: 0,
  lastSuppDate: '',
  hydration: { count: 0, date: '' },
  weight: null,
  height: null,
  moods: [],
  transactions: [],
  recurringExpenses: [],
};

const AppContext = createContext<AppContextType | null>(null);

function findItemDetails(
  id: string,
  data: AppData
): { name: string; amount: number; category: string; storeKey: string; week: number } | null {
  for (let w = 1; w <= 4; w++) {
    const cats = BUILTIN_ITEMS[w] ?? [];
    const removed = data.removed[String(w)] ?? [];
    for (const cat of cats) {
      for (const item of cat.items) {
        if (item.id === id && !removed.includes(id)) {
          return {
            name: data.names[id] ?? item.name,
            amount: data.prices[id] ?? item.defaultPrice,
            category: cat.cat,
            storeKey: data.stores[id] ?? item.storeKey,
            week: w,
          };
        }
      }
    }
    const custom = data.custom[String(w)] ?? [];
    const ci = custom.find((c) => c.id === id);
    if (ci) {
      return {
        name: data.names[id] ?? ci.name,
        amount: data.prices[id] ?? ci.defaultPrice,
        category: ci.category,
        storeKey: data.stores[id] ?? ci.storeKey,
        week: w,
      };
    }
  }
  return null;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(DEFAULT_DATA);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) {
        AsyncStorage.getItem('pattha_data_v2').then((oldRaw) => {
          if (!oldRaw) return;
          try {
            const parsed = JSON.parse(oldRaw) as Partial<AppData>;
            setData(() => ({
              ...DEFAULT_DATA,
              ...parsed,
              custom: { '1': [], '2': [], '3': [], '4': [], ...parsed.custom },
              removed: { '1': [], '2': [], '3': [], '4': [], ...parsed.removed },
              transactions: [],
              recurringExpenses: [],
              suppStreak: 0,
              lastSuppDate: '',
            }));
          } catch { }
        });
        return;
      }
      try {
        const parsed = JSON.parse(raw) as Partial<AppData>;
        setData(() => ({
          ...DEFAULT_DATA,
          ...parsed,
          custom: { '1': [], '2': [], '3': [], '4': [], ...parsed.custom },
          removed: { '1': [], '2': [], '3': [], '4': [], ...parsed.removed },
          transactions: parsed.transactions ?? [],
          recurringExpenses: parsed.recurringExpenses ?? [],
        }));
      } catch { }
    });
  }, []);

  const persist = useCallback((next: AppData) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }, 300);
  }, []);

  const update = useCallback((updater: (prev: AppData) => AppData) => {
    setData((prev) => {
      const next = updater(prev);
      persist(next);
      return next;
    });
  }, [persist]);

  const weeklyBudget = data.monthlyBudget / 4;

  const getWeekSpent = useCallback((week: number): number => {
    const cats = BUILTIN_ITEMS[week] ?? [];
    const removed = data.removed[String(week)] ?? [];
    let total = 0;
    cats.forEach((cat) => {
      cat.items.forEach((item) => {
        if (removed.includes(item.id)) return;
        if (data.checks[item.id]) {
          total += data.prices[item.id] ?? item.defaultPrice;
        }
      });
    });
    (data.custom[String(week)] ?? []).forEach((item) => {
      if (data.checks[item.id]) {
        total += data.prices[item.id] ?? item.defaultPrice;
      }
    });
    data.transactions
      .filter((t) => t.type === 'quick' && t.week === week)
      .forEach((t) => { total += t.amount; });
    return total;
  }, [data]);

  const getEffectiveWeeklyBudget = useCallback((week: number): number => {
    if (!data.rolloverEnabled) return weeklyBudget;
    let effective = weeklyBudget;
    for (let w = 1; w < week; w++) {
      const spent = getWeekSpent(w);
      const rollover = weeklyBudget - spent;
      if (rollover > 0) effective += rollover;
    }
    return effective;
  }, [data.rolloverEnabled, weeklyBudget, getWeekSpent]);

  const effectiveWeekBudgets = useMemo(() => {
    return [1, 2, 3, 4].map((w) => getEffectiveWeeklyBudget(w));
  }, [getEffectiveWeeklyBudget]);

  const getAllItems = useCallback((week: number) => {
    const removed = data.removed[String(week)] ?? [];
    const builtIn = (BUILTIN_ITEMS[week] ?? []).map((cat) => ({
      cat: cat.cat,
      items: cat.items
        .filter((i) => !removed.includes(i.id))
        .map((i) => ({
          id: i.id,
          name: data.names[i.id] ?? i.name,
          defaultPrice: i.defaultPrice,
          storeKey: data.stores[i.id] ?? i.storeKey,
        })),
    })).filter((c) => c.items.length > 0);

    const customItems = data.custom[String(week)] ?? [];
    if (customItems.length > 0) {
      const grouped: Record<string, typeof customItems> = {};
      customItems.forEach((item) => {
        const cat = item.category || '📝 Added Items';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(item);
      });
      Object.entries(grouped).forEach(([cat, items]) => {
        builtIn.push({
          cat,
          items: items.map((i) => ({
            id: i.id,
            name: data.names[i.id] ?? i.name,
            defaultPrice: i.defaultPrice,
            storeKey: data.stores[i.id] ?? i.storeKey,
          })),
        });
      });
    }

    return builtIn;
  }, [data]);

  const getCategorySpending = useCallback(() => {
    const totals: Record<string, number> = {};
    for (let w = 1; w <= 4; w++) {
      const cats = BUILTIN_ITEMS[w] ?? [];
      const removed = data.removed[String(w)] ?? [];
      cats.forEach((cat) => {
        cat.items.forEach((item) => {
          if (removed.includes(item.id) || !data.checks[item.id]) return;
          const amt = data.prices[item.id] ?? item.defaultPrice;
          totals[cat.cat] = (totals[cat.cat] ?? 0) + amt;
        });
      });
      (data.custom[String(w)] ?? []).forEach((item) => {
        if (!data.checks[item.id]) return;
        const amt = data.prices[item.id] ?? item.defaultPrice;
        const key = item.category || '📝 Added Items';
        totals[key] = (totals[key] ?? 0) + amt;
      });
    }
    data.transactions.filter((t) => t.type === 'quick').forEach((t) => {
      totals[t.category] = (totals[t.category] ?? 0) + t.amount;
    });
    return Object.entries(totals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [data]);

  const tickItem = useCallback((id: string) => {
    update((prev) => {
      const nowChecked = !prev.checks[id];
      const checks = { ...prev.checks, [id]: nowChecked };
      let transactions = [...prev.transactions];
      if (nowChecked) {
        const details = findItemDetails(id, prev);
        if (details) {
          transactions = [
            {
              id: 't_' + id + '_' + Date.now(),
              name: details.name,
              amount: prev.prices[id] ?? details.amount,
              category: details.category,
              storeKey: details.storeKey,
              date: new Date().toISOString(),
              week: details.week,
              type: 'shopping' as const,
            },
            ...transactions.filter((t) => !(t.type === 'shopping' && t.id.includes('t_' + id))),
          ].slice(0, 500);
        }
      } else {
        transactions = transactions.filter((t) => !(t.type === 'shopping' && t.id.includes('t_' + id)));
      }
      return { ...prev, checks, transactions };
    });
  }, [update]);

  const setItemPrice = useCallback((id: string, price: number) => {
    update((prev) => {
      const prices = { ...prev.prices, [id]: price };
      const transactions = prev.transactions.map((t) =>
        t.type === 'shopping' && t.id.includes('t_' + id) ? { ...t, amount: price } : t
      );
      return { ...prev, prices, transactions };
    });
  }, [update]);

  const setItemName = useCallback((id: string, name: string) => {
    update((prev) => ({ ...prev, names: { ...prev.names, [id]: name } }));
  }, [update]);

  const setItemStore = useCallback((id: string, storeKey: string) => {
    update((prev) => ({ ...prev, stores: { ...prev.stores, [id]: storeKey } }));
  }, [update]);

  const addCustomItem = useCallback((week: number, item: Omit<CustomItem, 'id'>) => {
    const id = 'c_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    update((prev) => ({
      ...prev,
      custom: {
        ...prev.custom,
        [String(week)]: [...(prev.custom[String(week)] ?? []), { ...item, id }],
      },
    }));
  }, [update]);

  const removeItem = useCallback((week: number, id: string) => {
    update((prev) => {
      const isBuiltin = (BUILTIN_ITEMS[week] ?? []).some((cat) => cat.items.some((i) => i.id === id));
      if (isBuiltin) {
        return {
          ...prev,
          removed: {
            ...prev.removed,
            [String(week)]: [...(prev.removed[String(week)] ?? []), id],
          },
          checks: { ...prev.checks, [id]: false },
        };
      }
      return {
        ...prev,
        custom: {
          ...prev.custom,
          [String(week)]: (prev.custom[String(week)] ?? []).filter((i) => i.id !== id),
        },
        checks: { ...prev.checks, [id]: false },
      };
    });
  }, [update]);

  const checkAllWeek = useCallback((week: number) => {
    update((prev) => {
      const allItems = (BUILTIN_ITEMS[week] ?? []).flatMap((c) => c.items)
        .filter((i) => !(prev.removed[String(week)] ?? []).includes(i.id));
      const customItems = prev.custom[String(week)] ?? [];
      const newChecks = { ...prev.checks };
      const newTransactions = [...prev.transactions];
      [...allItems, ...customItems].forEach((item) => {
        if (!newChecks[item.id]) {
          newChecks[item.id] = true;
          const category = (BUILTIN_ITEMS[week] ?? []).find((c) => c.items.some((i) => i.id === item.id))?.cat ?? '📝 Added Items';
          newTransactions.unshift({
            id: 't_' + item.id + '_' + Date.now(),
            name: prev.names[item.id] ?? item.name,
            amount: prev.prices[item.id] ?? item.defaultPrice,
            category,
            storeKey: prev.stores[item.id] ?? item.storeKey,
            date: new Date().toISOString(),
            week,
            type: 'shopping',
          });
        }
      });
      return { ...prev, checks: newChecks, transactions: newTransactions.slice(0, 500) };
    });
  }, [update]);

  const uncheckAllWeek = useCallback((week: number) => {
    update((prev) => {
      const allItems = (BUILTIN_ITEMS[week] ?? []).flatMap((c) => c.items)
        .filter((i) => !(prev.removed[String(week)] ?? []).includes(i.id));
      const customItems = prev.custom[String(week)] ?? [];
      const newChecks = { ...prev.checks };
      [...allItems, ...customItems].forEach((item) => { newChecks[item.id] = false; });
      const ids = new Set([...allItems, ...customItems].map((i) => i.id));
      const transactions = prev.transactions.filter((t) => !(t.type === 'shopping' && ids.has(t.id.split('_')[1])));
      return { ...prev, checks: newChecks, transactions };
    });
  }, [update]);

  const resetWeek = useCallback((week: number) => {
    update((prev) => ({
      ...prev,
      removed: { ...prev.removed, [String(week)]: [] },
      custom: { ...prev.custom, [String(week)]: [] },
    }));
  }, [update]);

  const clearAll = useCallback(() => {
    update(() => ({ ...DEFAULT_DATA }));
  }, [update]);

  const setMonthlyBudget = useCallback((budget: number) => {
    update((prev) => ({ ...prev, monthlyBudget: budget }));
  }, [update]);

  const setGoal = useCallback((goal: SavingsGoal | null) => {
    update((prev) => ({ ...prev, goal }));
  }, [update]);

  const generateMeals = useCallback((week: number) => {
    update((prev) => {
      const tickedItems = [];
      for (const cat of prev.custom[String(week)] ?? []) {
        if (prev.checks[cat.id]) tickedItems.push(cat.name);
      }
      for (const cat of BUILTIN_ITEMS[week] ?? []) {
        for (const item of cat.items) {
          if (prev.checks[item.id]) tickedItems.push(prev.names[item.id] ?? item.name);
        }
      }
      const plan = generateMealPlan(week, tickedItems);
      return { ...prev, generatedMeals: { ...prev.generatedMeals, [String(week)]: plan } };
    });
  }, [update]);

  const toggleMealCooked = useCallback((key: string) => {
    update((prev) => ({
      ...prev,
      mealCooked: { ...prev.mealCooked, [key]: !prev.mealCooked[key] },
    }));
  }, [update]);

  const takeSupplement = useCallback((id: string) => {
    update((prev) => {
      const today = new Date().toISOString().split('T')[0];
      const isToday = prev.suppDate === today;
      const suppTaken = isToday ? { ...prev.suppTaken, [id]: !prev.suppTaken[id] } : { [id]: true };

      let suppStreak = prev.suppStreak;
      let lastSuppDate = prev.lastSuppDate;

      if (!isToday) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().split('T')[0];
        suppStreak = prev.lastSuppDate === yStr ? suppStreak + 1 : 1;
        lastSuppDate = today;
      }

      return { ...prev, suppTaken, suppDate: today, suppStreak, lastSuppDate };
    });
  }, [update]);

  const resetSupplements = useCallback(() => {
    update((prev) => ({ ...prev, suppTaken: {}, suppDate: '' }));
  }, [update]);

  const addWater = useCallback(() => {
    update((prev) => {
      const today = new Date().toISOString().split('T')[0];
      const count = prev.hydration.date === today ? prev.hydration.count + 1 : 1;
      return { ...prev, hydration: { count, date: today } };
    });
  }, [update]);

  const removeWater = useCallback(() => {
    update((prev) => {
      const today = new Date().toISOString().split('T')[0];
      const count = prev.hydration.date === today ? Math.max(0, prev.hydration.count - 1) : 0;
      return { ...prev, hydration: { count, date: today } };
    });
  }, [update]);

  const setWeight = useCallback((w: number | null) => {
    update((prev) => ({ ...prev, weight: w }));
  }, [update]);

  const setHeight = useCallback((h: number | null) => {
    update((prev) => ({ ...prev, height: h }));
  }, [update]);

  const addMood = useCallback((mood: MoodEntry) => {
    update((prev) => {
      const moods = [mood, ...prev.moods.filter((m) => m.date !== mood.date)].slice(0, 90);
      return { ...prev, moods };
    });
  }, [update]);

  const addQuickExpense = useCallback((name: string, amount: number, category: string) => {
    update((prev) => {
      const today = new Date();
      const dayOfMonth = today.getDate();
      const week = dayOfMonth <= 7 ? 1 : dayOfMonth <= 14 ? 2 : dayOfMonth <= 21 ? 3 : 4;
      const tx: Transaction = {
        id: 'q_' + Date.now(),
        name,
        amount,
        category,
        storeKey: 'any',
        date: today.toISOString(),
        week,
        type: 'quick',
      };
      return { ...prev, transactions: [tx, ...prev.transactions].slice(0, 500) };
    });
  }, [update]);

  const removeTransaction = useCallback((id: string) => {
    update((prev) => ({ ...prev, transactions: prev.transactions.filter((t) => t.id !== id) }));
  }, [update]);

  const addRecurringExpense = useCallback((expense: Omit<RecurringExpense, 'id' | 'paid'>) => {
    const id = 'r_' + Date.now();
    update((prev) => ({
      ...prev,
      recurringExpenses: [...prev.recurringExpenses, { ...expense, id, paid: {} }],
    }));
  }, [update]);

  const updateRecurringExpense = useCallback((id: string, expense: Partial<Omit<RecurringExpense, 'id'>>) => {
    update((prev) => ({
      ...prev,
      recurringExpenses: prev.recurringExpenses.map((r) => r.id === id ? { ...r, ...expense } : r),
    }));
  }, [update]);

  const removeRecurringExpense = useCallback((id: string) => {
    update((prev) => ({
      ...prev,
      recurringExpenses: prev.recurringExpenses.filter((r) => r.id !== id),
    }));
  }, [update]);

  const toggleRecurringPaid = useCallback((id: string, monthKey: string) => {
    update((prev) => ({
      ...prev,
      recurringExpenses: prev.recurringExpenses.map((r) =>
        r.id === id ? { ...r, paid: { ...r.paid, [monthKey]: !r.paid[monthKey] } } : r
      ),
    }));
  }, [update]);

  const setRolloverEnabled = useCallback((enabled: boolean) => {
    update((prev) => ({ ...prev, rolloverEnabled: enabled }));
  }, [update]);

  const value: AppContextType = {
    data,
    weeklyBudget,
    tickItem,
    setItemPrice,
    setItemName,
    setItemStore,
    addCustomItem,
    removeItem,
    checkAllWeek,
    uncheckAllWeek,
    resetWeek,
    clearAll,
    setMonthlyBudget,
    setGoal,
    generateMeals,
    toggleMealCooked,
    takeSupplement,
    resetSupplements,
    addWater,
    removeWater,
    setWeight,
    setHeight,
    addMood,
    addQuickExpense,
    removeTransaction,
    addRecurringExpense,
    updateRecurringExpense,
    removeRecurringExpense,
    toggleRecurringPaid,
    setRolloverEnabled,
    getWeekSpent,
    getEffectiveWeeklyBudget,
    effectiveWeekBudgets,
    getAllItems,
    getCategorySpending,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
