import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/context/AppContext';
import { checkIngredients, HALAL_TIPS } from '@/data/halalChecker';
import { useColors } from '@/hooks/useColors';
import {
  applyNotificationSettings,
  requestNotificationPermission,
} from '@/services/notifications';
import {
  shariahFilter,
  calculateZakat,
  buildLeaderboard,
  type CompanyData,
  type StudentAssets,
  type PeerProfile,
} from '@/services/islamicFinance';

// ── Static fallbacks ──────────────────────────────────────────────────────────
const FALLBACK_PRAYER_CITY = 'Seelow, Germany';
const FALLBACK_PRAYER_TIMES = [
  { name: 'Fajr',     time: '04:12', icon: 'sunrise' as const },
  { name: 'Dhuhr',    time: '13:14', icon: 'sun'     as const },
  { name: "Jumu'ah",  time: '13:14', icon: 'sun'     as const },
  { name: 'Asr',      time: '17:00', icon: 'sunset'  as const },
  { name: 'Maghrib',  time: '21:28', icon: 'moon'    as const },
  { name: 'Isha',     time: '23:12', icon: 'star'    as const },
];

type PrayerRow = { name: string; time: string; icon: 'sunrise' | 'sun' | 'sunset' | 'moon' | 'star' };

const STUDENT_DISCOUNTS = [
  { name: 'Amazon Prime Student', detail: '6 months free, then 50% off', category: 'Shopping' },
  { name: 'Spotify Student', detail: '€2.99/month (50% off)', category: 'Music' },
  { name: 'BahnCard 25 Student', detail: 'Train rides 25% cheaper', category: 'Travel' },
  { name: 'Microsoft Office 365', detail: 'Free for students via uni email', category: 'Software' },
  { name: 'GitHub Student Pack', detail: 'Free tools worth $200K/yr', category: 'Dev' },
  { name: 'Adobe Creative Cloud', detail: '~60% off with student ID', category: 'Creative' },
  { name: 'Notion', detail: 'Free Personal Pro plan', category: 'Productivity' },
  { name: 'Figma', detail: 'Free Professional plan', category: 'Design' },
];

const CURRENCIES = [
  { code: 'INR', flag: '🇮🇳', name: 'Indian Rupee' },
  { code: 'PKR', flag: '🇵🇰', name: 'Pakistani Rupee' },
  { code: 'SAR', flag: '🇸🇦', name: 'Saudi Riyal' },
  { code: 'AED', flag: '🇦🇪', name: 'UAE Dirham' },
  { code: 'BDT', flag: '🇧🇩', name: 'Bangladeshi Taka' },
  { code: 'USD', flag: '🇺🇸', name: 'US Dollar' },
];

const FALLBACK_RATES: Record<string, number> = {
  INR: 90, PKR: 300, SAR: 4.08, AED: 3.98, BDT: 118, USD: 1.09,
};

type MoreTab = 'halal' | 'prayer' | 'currency' | 'zakat' | 'invest' | 'peers' | 'discounts' | 'settings';

function ScalePressable({ children, onPress, style }: { children: React.ReactNode; onPress: () => void; style?: any }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 30, bounciness: 0 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 4 }).start()}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

function stripTz(t: string) {
  // AlAdhan returns "04:12" or "04:12 (CET)" — strip timezone suffix
  return t ? t.split(' ')[0] : '--:--';
}

export default function MoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data, clearAll, setRolloverEnabled } = useApp();

  const [tab, setTab] = useState<MoreTab>('halal');
  const [halalText, setHalalText] = useState('');
  const [halalResults, setHalalResults] = useState<ReturnType<typeof checkIngredients>>([]);
  const [notifPrayer, setNotifPrayer] = useState(false);
  const [notifSupps, setNotifSupps] = useState(false);
  const [notifHydration, setNotifHydration] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      requestNotificationPermission().then(setNotifGranted);
    }
  }, []);

  const applyNotifs = async (prayer: boolean, supps: boolean, hydration: boolean) => {
    if (Platform.OS === 'web') return;
    const granted = await requestNotificationPermission();
    setNotifGranted(granted);
    if (!granted) {
      Alert.alert('Notifications blocked', 'Please allow notifications in your device settings.');
      return;
    }
    await applyNotificationSettings({ prayer, supplements: supps, hydration });
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const toggleNotif = async (type: 'prayer' | 'supps' | 'hydration') => {
    let p = notifPrayer, s = notifSupps, h = notifHydration;
    if (type === 'prayer') { p = !p; setNotifPrayer(p); }
    if (type === 'supps') { s = !s; setNotifSupps(s); }
    if (type === 'hydration') { h = !h; setNotifHydration(h); }
    await applyNotifs(p, s, h);
  };

  // ── Prayer times (location-aware) ─────────────────────────────────────────
  const [prayerLoading, setPrayerLoading] = useState(false);
  const [prayerError, setprayerError] = useState<string | null>(null);
  const [prayerCity, setPrayerCity] = useState<string | null>(null);
  const [prayerDateStr, setPrayerDateStr] = useState<string | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerRow[]>(FALLBACK_PRAYER_TIMES);
  const [prayerMethod, setPrayerMethod] = useState<string>('');

  const fetchPrayerTimes = useCallback(async () => {
    setPrayerLoading(true);
    setprayerError(null);

    try {
      // 1. Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setprayerError('Location permission denied — showing Seelow, Germany as fallback.');
        setPrayerCity(FALLBACK_PRAYER_CITY);
        setPrayerTimes(FALLBACK_PRAYER_TIMES);
        return;
      }

      // 2. Get position
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;

      // 3. Reverse geocode for city name
      let cityLabel = `${latitude.toFixed(3)}°, ${longitude.toFixed(3)}°`;
      try {
        const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geo.length > 0) {
          const g = geo[0];
          const city = g.city || g.subregion || g.district || g.region || '';
          const country = g.country || '';
          cityLabel = [city, country].filter(Boolean).join(', ') || cityLabel;
        }
      } catch {
        // keep coordinate fallback
      }
      setPrayerCity(cityLabel);

      // 4. Fetch prayer times from AlAdhan (HTTPS, method 2 = ISNA)
      const ts = Math.floor(Date.now() / 1000);
      const url = `https://api.aladhan.com/v1/timings/${ts}?latitude=${latitude}&longitude=${longitude}&method=2`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`AlAdhan HTTP ${res.status}`);
      const json = await res.json();

      if (json.code !== 200 || !json.data?.timings) {
        throw new Error('Invalid AlAdhan response');
      }

      const t = json.data.timings;
      const meta = json.data.meta;
      const dateInfo = json.data.date;

      setPrayerDateStr(
        dateInfo?.readable ||
        new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      );
      setPrayerMethod(meta?.method?.name || '');

      const now = new Date();
      const isJumaa = now.getDay() === 5; // Friday

      setPrayerTimes([
        { name: 'Fajr',    time: stripTz(t.Fajr),    icon: 'sunrise' },
        { name: 'Dhuhr',   time: stripTz(t.Dhuhr),   icon: 'sun'     },
        ...(isJumaa ? [{ name: "Jumu'ah", time: stripTz(t.Dhuhr), icon: 'sun' as const }] : []),
        { name: 'Asr',     time: stripTz(t.Asr),     icon: 'sunset'  },
        { name: 'Maghrib', time: stripTz(t.Maghrib), icon: 'moon'    },
        { name: 'Isha',    time: stripTz(t.Isha),    icon: 'star'    },
      ]);
    } catch (err: any) {
      setprayerError('Could not fetch live prayer times. Check your internet connection.');
      setPrayerCity(FALLBACK_PRAYER_CITY + ' (fallback)');
      setPrayerTimes(FALLBACK_PRAYER_TIMES);
    } finally {
      setPrayerLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'prayer') fetchPrayerTimes();
  }, [tab, fetchPrayerTimes]);

  // ── Currency converter ────────────────────────────────────────────────────
  const [currencyAmt, setCurrencyAmt] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('PKR');
  const [liveRates, setLiveRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesUpdatedAt, setRatesUpdatedAt] = useState<string | null>(null);
  const [ratesError, setRatesError] = useState(false);

  const fetchRates = async () => {
    setRatesLoading(true);
    setRatesError(false);
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/EUR`);
      if (!res.ok) throw new Error('fetch failed');
      const json = await res.json();
      if (json.rates) {
        setLiveRates({ ...FALLBACK_RATES, ...json.rates });
        const d = new Date();
        setRatesUpdatedAt(d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch {
      setRatesError(true);
    } finally {
      setRatesLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'currency') fetchRates();
  }, [tab]);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const runHalalCheck = () => {
    if (!halalText.trim()) return;
    Keyboard.dismiss();
    const results = checkIngredients(halalText);
    setHalalResults(results);
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const haramCount = halalResults.filter((r) => r.status === 'haram').length;
  const doubtfulCount = halalResults.filter((r) => r.status === 'doubtful').length;

  // ── Module 3: Zakat calculator state ─────────────────────────────────
  const [zakatSavings, setZakatSavings] = useState('');
  const [zakatTuition, setZakatTuition] = useState('');
  const [zakatRent, setZakatRent] = useState('');
  const zakatResult = zakatSavings
    ? calculateZakat({
        totalSavings: parseFloat(zakatSavings) || 0,
        upcomingTuition: parseFloat(zakatTuition) || 0,
        immediateRent: parseFloat(zakatRent) || 0,
      })
    : null;

  // ── Module 2: Shariah filter state ───────────────────────────────────
  const [siCompany, setSiCompany] = useState('');
  const [siTicker, setSiTicker] = useState('');
  const [siDebt, setSiDebt] = useState(false);
  const [siGambling, setSiGambling] = useState(false);
  const [siResult, setSiResult] = useState<ReturnType<typeof shariahFilter> | null>(null);

  const runShariahCheck = () => {
    if (!siTicker.trim()) return;
    setSiResult(
      shariahFilter({
        companyName: siCompany.trim() || siTicker.trim(),
        ticker: siTicker.trim().toUpperCase(),
        hasInterestBearingDebt: siDebt,
        hasGamblingOrAlcoholRevenue: siGambling,
        isCompliant: !siDebt && !siGambling,
      }),
    );
    Keyboard.dismiss();
  };

  // ── Module 4: Peer accountability state ──────────────────────────────
  const [peers, setPeers] = useState<PeerProfile[]>([
    { nickname: 'BrotherA', mealPrepStreak: 5, hydrationStreak: 7 },
    { nickname: 'SisterB', mealPrepStreak: 3, hydrationStreak: 6 },
    { nickname: 'You', mealPrepStreak: 4, hydrationStreak: 5 },
  ]);
  const [newNick, setNewNick] = useState('');
  const [newMeal, setNewMeal] = useState('');
  const [newHydro, setNewHydro] = useState('');
  const leaderboard = buildLeaderboard(peers);

  const addPeer = () => {
    if (!newNick.trim()) return;
    setPeers((prev) => [
      ...prev,
      {
        nickname: newNick.trim(),
        mealPrepStreak: parseInt(newMeal) || 0,
        hydrationStreak: parseInt(newHydro) || 0,
      },
    ]);
    setNewNick(''); setNewMeal(''); setNewHydro('');
    Keyboard.dismiss();
  };

  const TABS: { id: MoreTab; label: string; icon: any }[] = [
    { id: 'halal',    label: 'Halal',    icon: 'check-circle'  },
    { id: 'prayer',   label: 'Prayer',   icon: 'clock'         },
    { id: 'currency', label: 'Currency', icon: 'refresh-cw'    },
    { id: 'zakat',    label: 'Zakat',    icon: 'percent'       },
    { id: 'invest',   label: 'Invest',   icon: 'trending-up'   },
    { id: 'peers',    label: 'Peers',    icon: 'users'         },
    { id: 'discounts',label: 'Deals',    icon: 'tag'           },
    { id: 'settings', label: 'Settings', icon: 'settings'      },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[s.header, { paddingTop: topPad + 8, backgroundColor: colors.navBg, borderBottomColor: colors.border }]}>
        <Text style={[s.headerTitle, { color: colors.text }]}>More</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TABS.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => { setTab(t.id); Keyboard.dismiss(); }}
              style={({ pressed }) => [
                s.tabPill,
                {
                  backgroundColor: tab === t.id ? colors.primary + '20' : colors.input,
                  borderColor: tab === t.id ? colors.primary : colors.border,
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                },
              ]}
            >
              <Feather name={t.icon} size={12} color={tab === t.id ? colors.primary : colors.muted} />
              <Text style={[s.tabPillText, { color: tab === t.id ? colors.primary : colors.muted }]}>{t.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: botPad + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── Halal Checker ── */}
        {tab === 'halal' && (
          <View>
            <Text style={[s.sectionTitle, { color: colors.text }]}>E-Number & Ingredient Checker</Text>
            <Text style={[s.sectionSub, { color: colors.muted }]}>
              Paste a product's ingredient list to check for haram or doubtful ingredients
            </Text>
            <TextInput
              style={[s.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              value={halalText}
              onChangeText={setHalalText}
              placeholder={'Paste ingredients here...\ne.g. sugar, E471, gelatin, soy lecithin'}
              placeholderTextColor={colors.muted}
              multiline
              textAlignVertical="top"
              returnKeyType="done"
              blurOnSubmit
            />
            <ScalePressable
              onPress={runHalalCheck}
              style={[s.checkBtn, { backgroundColor: colors.primary, opacity: halalText.trim() ? 1 : 0.5 }]}
            >
              <Feather name="search" size={16} color={colors.primaryForeground} />
              <Text style={[s.checkBtnText, { color: colors.primaryForeground }]}>Check Ingredients</Text>
            </ScalePressable>

            {halalResults.length > 0 && (
              <View>
                <View style={s.halalSummary}>
                  {haramCount > 0 && (
                    <View style={[s.summaryChip, { backgroundColor: colors.redDim, borderColor: colors.red + '40' }]}>
                      <Text style={[s.summaryChipText, { color: colors.red }]}>{haramCount} Haram</Text>
                    </View>
                  )}
                  {doubtfulCount > 0 && (
                    <View style={[s.summaryChip, { backgroundColor: colors.goldDim, borderColor: colors.gold + '40' }]}>
                      <Text style={[s.summaryChipText, { color: colors.gold }]}>{doubtfulCount} Doubtful</Text>
                    </View>
                  )}
                  {haramCount === 0 && doubtfulCount === 0 && (
                    <View style={[s.summaryChip, { backgroundColor: colors.primaryDim, borderColor: colors.primary + '40' }]}>
                      <Text style={[s.summaryChipText, { color: colors.primary }]}>✓ All Clear</Text>
                    </View>
                  )}
                </View>
                {halalResults.filter((r) => r.status !== 'halal').map((r, i) => (
                  <View
                    key={i}
                    style={[
                      s.resultRow,
                      {
                        backgroundColor: r.status === 'haram' ? colors.redDim : colors.goldDim,
                        borderColor: r.status === 'haram' ? colors.red + '30' : colors.gold + '30',
                      },
                    ]}
                  >
                    <Feather
                      name={r.status === 'haram' ? 'x-circle' : 'alert-circle'}
                      size={16}
                      color={r.status === 'haram' ? colors.red : colors.gold}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[s.resultIngredient, { color: colors.text }]}>{r.cleaned}</Text>
                      <Text style={[s.resultReason, { color: colors.muted }]}>{r.reason}</Text>
                    </View>
                  </View>
                ))}
                <Text style={[s.tipsTitle, { color: colors.text }]}>Tips</Text>
                {HALAL_TIPS.slice(0, 3).map((tip, i) => (
                  <View key={i} style={[s.tipRow, { borderLeftColor: colors.primary }]}>
                    <Text style={[s.tipText, { color: colors.muted }]}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Prayer Times ── */}
        {tab === 'prayer' && (
          <View>
            {/* Header row */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
              <View style={{ flex: 1 }}>
                <Text style={[s.sectionTitle, { color: colors.text }]}>Prayer Times</Text>
                <Text style={[s.sectionSub, { color: colors.muted, marginBottom: 0 }]}>
                  {prayerLoading
                    ? 'Detecting your location…'
                    : prayerCity
                    ? prayerCity
                    : 'Fetching location…'}
                  {prayerDateStr && !prayerLoading ? `  ·  ${prayerDateStr}` : ''}
                </Text>
              </View>
              <Pressable
                onPress={fetchPrayerTimes}
                disabled={prayerLoading}
                style={({ pressed }) => [
                  s.refreshBtn,
                  { backgroundColor: colors.primaryDim, opacity: prayerLoading || pressed ? 0.5 : 1 },
                ]}
              >
                <Feather name="refresh-cw" size={14} color={colors.primary} />
              </Pressable>
            </View>

            {/* Error banner */}
            {prayerError && (
              <View style={[s.errorBanner, { backgroundColor: colors.goldDim, borderColor: colors.gold + '40' }]}>
                <Feather name="alert-triangle" size={13} color={colors.gold} />
                <Text style={[s.errorBannerText, { color: colors.gold }]}>{prayerError}</Text>
              </View>
            )}

            {/* Loading skeleton */}
            {prayerLoading ? (
              <View style={{ gap: 8, marginTop: 12 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <View key={i} style={[s.prayerRow, { backgroundColor: colors.card, borderColor: colors.border, opacity: 0.4 }]}>
                    <View style={[s.prayerIcon, { backgroundColor: colors.primaryDim }]} />
                    <View style={{ flex: 1, height: 14, backgroundColor: colors.input, borderRadius: 6 }} />
                    <View style={{ width: 52, height: 14, backgroundColor: colors.input, borderRadius: 6 }} />
                  </View>
                ))}
              </View>
            ) : (
              <View style={{ marginTop: 12 }}>
                {prayerTimes.map((p) => (
                  <View key={p.name} style={[s.prayerRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[s.prayerIcon, { backgroundColor: colors.primaryDim }]}>
                      <Feather name={p.icon} size={16} color={colors.primary} />
                    </View>
                    <Text style={[s.prayerName, { color: colors.text }]}>{p.name}</Text>
                    <Text style={[s.prayerTime, { color: colors.primary }]}>{p.time}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Method badge */}
            {prayerMethod && !prayerLoading && (
              <Text style={[s.disclaimer, { color: colors.muted, marginTop: 10 }]}>
                Calculation method: {prayerMethod}
              </Text>
            )}

            <Text style={[s.disclaimer, { color: colors.muted }]}>
              ⚠️ Times are computed from your GPS location. For the most precise times use IslamicFinder or Athan app.
            </Text>
            <ScalePressable
              onPress={() => Linking.openURL('https://www.islamicfinder.org/')}
              style={[s.linkBtn, { backgroundColor: colors.primaryDim, borderColor: colors.primary + '30' }]}
            >
              <Feather name="external-link" size={14} color={colors.primary} />
              <Text style={[s.linkBtnText, { color: colors.primary }]}>IslamicFinder.org</Text>
            </ScalePressable>
          </View>
        )}

        {/* ── Currency Converter ── */}
        {tab === 'currency' && (
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
              <View style={{ flex: 1 }}>
                <Text style={[s.sectionTitle, { color: colors.text }]}>EUR Converter</Text>
                <Text style={[s.sectionSub, { color: colors.muted, marginBottom: 0 }]}>
                  {ratesLoading
                    ? 'Fetching live rates…'
                    : ratesError
                    ? '⚠️ Using cached rates — check connection'
                    : ratesUpdatedAt
                    ? `✓ Live ECB rates · updated ${ratesUpdatedAt}`
                    : 'Live ECB exchange rates'}
                </Text>
              </View>
              <Pressable
                onPress={fetchRates}
                disabled={ratesLoading}
                style={({ pressed }) => [
                  s.refreshBtn,
                  { backgroundColor: colors.primaryDim, opacity: ratesLoading || pressed ? 0.5 : 1 },
                ]}
              >
                <Feather name="refresh-cw" size={14} color={colors.primary} />
              </Pressable>
            </View>

            <View style={[s.currencyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.currencyLabel, { color: colors.muted }]}>Amount in EUR (€)</Text>
              <TextInput
                style={[s.currencyInput, { color: colors.text, borderBottomColor: colors.primary }]}
                value={currencyAmt}
                onChangeText={setCurrencyAmt}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.muted}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
              {currencyAmt && parseFloat(currencyAmt) > 0 ? (
                <View style={s.convertResult}>
                  <Text style={[s.convertNum, { color: colors.primary }]}>
                    {(parseFloat(currencyAmt) * (liveRates[selectedCurrency] ?? 1)).toFixed(2)}
                  </Text>
                  <Text style={[s.convertCurrency, { color: colors.text }]}>{selectedCurrency}</Text>
                  <Text style={[s.convertRate, { color: colors.muted }]}>
                    1 EUR = {(liveRates[selectedCurrency] ?? 1).toFixed(4)} {selectedCurrency}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={s.currencyPills}>
              {CURRENCIES.map((c) => {
                const rate = liveRates[c.code];
                const active = selectedCurrency === c.code;
                return (
                  <ScalePressable
                    key={c.code}
                    onPress={() => setSelectedCurrency(c.code)}
                    style={[
                      s.currencyPill,
                      {
                        backgroundColor: active ? colors.primaryDim : colors.card,
                        borderColor: active ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 22 }}>{c.flag}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.currencyCode, { color: active ? colors.primary : colors.text }]}>
                        {c.code}
                      </Text>
                      <Text style={[s.currencyName, { color: colors.muted }]}>{c.name}</Text>
                    </View>
                    <Text style={[s.currencyRate, { color: active ? colors.primary : colors.muted }]}>
                      {ratesLoading ? '…' : rate ? rate.toFixed(2) : '—'}
                    </Text>
                  </ScalePressable>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Zakat Calculator ── */}
        {tab === 'zakat' && (
          <View>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Zakat Calculator</Text>
            <Text style={[s.sectionSub, { color: colors.muted }]}>
              Subtracts essential liabilities from savings before calculating 2.5% Zakat
            </Text>

            {[
              { label: '💰 Total Savings (€)', value: zakatSavings, set: setZakatSavings },
              { label: '🎓 Upcoming Tuition (€)', value: zakatTuition, set: setZakatTuition },
              { label: '🏠 Rent Due (€)', value: zakatRent, set: setZakatRent },
            ].map((f) => (
              <View key={f.label} style={[s.zakatField, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[s.zakatFieldLabel, { color: colors.muted }]}>{f.label}</Text>
                <TextInput
                  style={[s.zakatInput, { color: colors.text, borderBottomColor: colors.primary }]}
                  value={f.value}
                  onChangeText={f.set}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.muted}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
              </View>
            ))}

            {zakatResult !== null && (
              <View style={[s.zakatResult, {
                backgroundColor: zakatResult.isZakatRequired ? colors.primaryDim : colors.card,
                borderColor: zakatResult.isZakatRequired ? colors.primary : colors.border,
              }]}>
                <Text style={[s.zakatResultRow, { color: colors.muted }]}>
                  Net balance after liabilities
                </Text>
                <Text style={[s.zakatResultNum, { color: colors.text }]}>
                  €{zakatResult.netBalance.toFixed(2)}
                </Text>
                {zakatResult.isZakatRequired ? (
                  <>
                    <Text style={[s.zakatResultRow, { color: colors.muted, marginTop: 12 }]}>
                      Zakat due (2.5%)
                    </Text>
                    <Text style={[s.zakatResultNum, { color: colors.primary, fontSize: 32 }]}>
                      €{zakatResult.zakatDue.toFixed(2)}
                    </Text>
                    <Text style={[s.zakatNote, { color: colors.muted }]}>
                      Pay this amount to fulfill your Zakat obligation. May Allah accept it. 🤲
                    </Text>
                  </>
                ) : (
                  <Text style={[s.zakatNote, { color: colors.muted }]}>
                    ℹ️ No Zakat due — your liabilities cover your savings.
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* ── Shariah Investing Filter ── */}
        {tab === 'invest' && (
          <View>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Shariah Investment Filter</Text>
            <Text style={[s.sectionSub, { color: colors.muted }]}>
              Screen a company for Shariah compliance before investing
            </Text>

            <View style={[s.zakatField, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.zakatFieldLabel, { color: colors.muted }]}>Company Name (optional)</Text>
              <TextInput
                style={[s.zakatInput, { color: colors.text, borderBottomColor: colors.primary }]}
                value={siCompany}
                onChangeText={setSiCompany}
                placeholder="e.g. Apple Inc."
                placeholderTextColor={colors.muted}
                returnKeyType="next"
              />
            </View>
            <View style={[s.zakatField, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.zakatFieldLabel, { color: colors.muted }]}>Stock Ticker *</Text>
              <TextInput
                style={[s.zakatInput, { color: colors.text, borderBottomColor: colors.primary }]}
                value={siTicker}
                onChangeText={setSiTicker}
                placeholder="e.g. AAPL"
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>

            <Text style={[s.sectionSub, { color: colors.muted, marginTop: 8 }]}>Revenue / Debt flags</Text>
            {[
              { label: '🎰 Gambling or alcohol revenue', value: siGambling, set: setSiGambling },
              { label: '💸 High interest-bearing debt (riba)', value: siDebt, set: setSiDebt },
            ].map((flag) => (
              <Pressable
                key={flag.label}
                onPress={() => flag.set(!flag.value)}
                style={[
                  s.flagRow,
                  { backgroundColor: flag.value ? colors.redDim : colors.card, borderColor: flag.value ? colors.red + '50' : colors.border },
                ]}
              >
                <Text style={[s.flagLabel, { color: flag.value ? colors.red : colors.text }]}>{flag.label}</Text>
                <View style={[s.flagCheck, { backgroundColor: flag.value ? colors.red : colors.input, borderColor: flag.value ? colors.red : colors.border }]}>
                  {flag.value && <Feather name="x" size={12} color="#fff" />}
                </View>
              </Pressable>
            ))}

            <ScalePressable
              onPress={runShariahCheck}
              style={[s.checkBtn, { backgroundColor: colors.primary, opacity: siTicker.trim() ? 1 : 0.5, marginTop: 8 }]}
            >
              <Feather name="shield" size={16} color={colors.primaryForeground} />
              <Text style={[s.checkBtnText, { color: colors.primaryForeground }]}>Run Shariah Screen</Text>
            </ScalePressable>

            {siResult && (
              <View style={[s.siResult, {
                backgroundColor: siResult.compliant ? colors.primaryDim : colors.redDim,
                borderColor: siResult.compliant ? colors.primary : colors.red + '50',
              }]}>
                <Text style={[s.siResultMsg, { color: siResult.compliant ? colors.primary : colors.red }]}>
                  {siResult.message}
                </Text>
                {siResult.reasons.map((r, i) => (
                  <Text key={i} style={[s.siReason, { color: colors.muted }]}>• {r}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Peer Accountability ── */}
        {tab === 'peers' && (
          <View>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Peer Accountability</Text>
            <Text style={[s.sectionSub, { color: colors.muted }]}>
              Anonymous streak leaderboard — no bank balances, just healthy habits
            </Text>

            {leaderboard.map((entry) => (
              <View
                key={entry.nickname}
                style={[s.peerRow, {
                  backgroundColor: entry.rank === 1 ? colors.goldDim : colors.card,
                  borderColor: entry.rank === 1 ? colors.gold + '50' : colors.border,
                }]}
              >
                <Text style={[s.peerRank, { color: entry.rank === 1 ? colors.gold : colors.muted }]}>
                  {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.peerNick, { color: colors.text }]}>{entry.nickname}</Text>
                  <Text style={[s.peerStreaks, { color: colors.muted }]}>
                    🍱 {entry.mealPrepStreak}d · 💧 {entry.hydrationStreak}d
                  </Text>
                </View>
                <View style={[s.peerTotal, { backgroundColor: colors.primaryDim }]}>
                  <Text style={[s.peerTotalNum, { color: colors.primary }]}>{entry.totalStreak}</Text>
                  <Text style={[s.peerTotalLabel, { color: colors.muted }]}>streak</Text>
                </View>
              </View>
            ))}

            <Text style={[s.sectionSub, { color: colors.muted, marginTop: 16 }]}>Add a friend</Text>
            <View style={[s.peerForm, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[s.peerFormInput, { color: colors.text, borderBottomColor: colors.border }]}
                value={newNick}
                onChangeText={setNewNick}
                placeholder="Anonymous nickname"
                placeholderTextColor={colors.muted}
                returnKeyType="next"
              />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TextInput
                  style={[s.peerFormInput, { flex: 1, color: colors.text, borderBottomColor: colors.border }]}
                  value={newMeal}
                  onChangeText={setNewMeal}
                  placeholder="🍱 Meal streak"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  returnKeyType="next"
                />
                <TextInput
                  style={[s.peerFormInput, { flex: 1, color: colors.text, borderBottomColor: colors.border }]}
                  value={newHydro}
                  onChangeText={setNewHydro}
                  placeholder="💧 Hydration streak"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  onSubmitEditing={addPeer}
                />
              </View>
              <ScalePressable
                onPress={addPeer}
                style={[s.checkBtn, { backgroundColor: colors.primary, opacity: newNick.trim() ? 1 : 0.5, marginTop: 12 }]}
              >
                <Feather name="user-plus" size={15} color={colors.primaryForeground} />
                <Text style={[s.checkBtnText, { color: colors.primaryForeground }]}>Add to Board</Text>
              </ScalePressable>
            </View>
          </View>
        )}

        {/* ── Student Discounts ── */}
        {tab === 'discounts' && (
          <View>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Student Deals</Text>
            <Text style={[s.sectionSub, { color: colors.muted }]}>Save money as a student in Germany</Text>
            {STUDENT_DISCOUNTS.map((d) => (
              <View key={d.name} style={[s.discountRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[s.discountBadge, { backgroundColor: colors.primaryDim }]}>
                  <Feather name="tag" size={14} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.discountName, { color: colors.text }]}>{d.name}</Text>
                  <Text style={[s.discountDetail, { color: colors.primary }]}>{d.detail}</Text>
                  <Text style={[s.discountCat, { color: colors.muted }]}>{d.category}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Settings ── */}
        {tab === 'settings' && (
          <View>
            <Text style={[s.sectionTitle, { color: colors.text }]}>Settings</Text>

            <View style={[s.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.settingRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.settingLabel, { color: colors.text }]}>Budget Rollover</Text>
                  <Text style={[s.settingSub, { color: colors.muted }]}>Unused budget carries over to next week</Text>
                </View>
                <Pressable
                  onPress={() => setRolloverEnabled(!data.rolloverEnabled)}
                  style={[s.toggle, {
                    backgroundColor: data.rolloverEnabled ? colors.primary : colors.input,
                    borderColor: data.rolloverEnabled ? colors.primary : colors.border,
                  }]}
                >
                  <View style={[s.toggleDot, { marginLeft: data.rolloverEnabled ? 20 : 2 }]} />
                </Pressable>
              </View>
            </View>

            <Text style={[s.settingGroupTitle, { color: colors.muted }]}>Reminders</Text>
            {Platform.OS === 'web' ? (
              <View style={[s.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[s.settingSub, { color: colors.muted }]}>
                  Notifications are only available on the Expo Go app on your phone.
                </Text>
              </View>
            ) : (
              <View style={[s.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {[
                  { key: 'prayer'    as const, icon: '🕌', label: 'Prayer times',  sub: 'Reminders 5 min before each prayer', value: notifPrayer    },
                  { key: 'supps'     as const, icon: '💊', label: 'Supplements',   sub: 'Morning (8am) and evening (8pm)',     value: notifSupps     },
                  { key: 'hydration' as const, icon: '💧', label: 'Hydration',     sub: 'Drink-water nudge every 2h (9–21)',   value: notifHydration },
                ].map((item, idx, arr) => (
                  <View
                    key={item.key}
                    style={[
                      s.settingRow,
                      idx < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 14, marginBottom: 14 },
                    ]}
                  >
                    <Text style={{ fontSize: 22, marginRight: 10 }}>{item.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.settingLabel, { color: colors.text }]}>{item.label}</Text>
                      <Text style={[s.settingSub, { color: colors.muted }]}>{item.sub}</Text>
                    </View>
                    <Pressable
                      onPress={() => toggleNotif(item.key)}
                      style={[s.toggle, {
                        backgroundColor: item.value ? colors.primary : colors.input,
                        borderColor: item.value ? colors.primary : colors.border,
                      }]}
                    >
                      <View style={[s.toggleDot, { marginLeft: item.value ? 20 : 2 }]} />
                    </Pressable>
                  </View>
                ))}
                {!notifGranted && (
                  <Text style={[s.settingSub, { color: colors.gold, marginTop: 8 }]}>
                    ⚠️ Notification permission not granted. Tap a toggle to prompt.
                  </Text>
                )}
              </View>
            )}

            <ScalePressable
              onPress={() => {
                Alert.alert('Reset all data', 'This will clear all your shopping lists, budgets, meals, and health data. Cannot be undone.', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset everything',
                    style: 'destructive',
                    onPress: () => {
                      clearAll();
                      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    },
                  },
                ]);
              }}
              style={[s.dangerBtn, { backgroundColor: colors.redDim, borderColor: colors.red + '30' }]}
            >
              <Feather name="trash-2" size={16} color={colors.red} />
              <Text style={[s.dangerBtnText, { color: colors.red }]}>Reset all data</Text>
            </ScalePressable>

            <View style={[s.aboutCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.aboutTitle, { color: colors.text }]}>Pattha</Text>
              <Text style={[s.aboutSub, { color: colors.muted }]}>
                A Muslim student budget companion. Track halal groceries, meals, supplements, and savings goals wherever you are.
              </Text>
              <Text style={[s.aboutVer, { color: colors.muted }]}>v1.1.0 · Location-aware</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.6, marginBottom: 12 },
  tabPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, marginRight: 8,
  },
  tabPillText: { fontSize: 12, fontWeight: '700' },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3, marginBottom: 4 },
  sectionSub: { fontSize: 12, lineHeight: 17, marginBottom: 16 },
  textArea: {
    borderRadius: 14, padding: 14, fontSize: 13, lineHeight: 20,
    borderWidth: 1, marginBottom: 12, minHeight: 110,
  },
  checkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 14, padding: 14, justifyContent: 'center', marginBottom: 16,
  },
  checkBtnText: { fontSize: 15, fontWeight: '800' },
  halalSummary: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  summaryChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  summaryChipText: { fontSize: 12, fontWeight: '700' },
  resultRow: {
    flexDirection: 'row', gap: 10, padding: 12,
    borderRadius: 12, borderWidth: 1, marginBottom: 8, alignItems: 'flex-start',
  },
  resultIngredient: { fontSize: 13, fontWeight: '700' },
  resultReason: { fontSize: 11, lineHeight: 16, marginTop: 2 },
  tipsTitle: { fontSize: 14, fontWeight: '800', marginTop: 16, marginBottom: 10 },
  tipRow: { borderLeftWidth: 3, paddingLeft: 12, marginBottom: 10 },
  tipText: { fontSize: 12, lineHeight: 18 },
  // Prayer
  errorBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    padding: 10, borderRadius: 12, borderWidth: 1, marginBottom: 8,
  },
  errorBannerText: { fontSize: 11, lineHeight: 16, flex: 1 },
  prayerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8,
  },
  prayerIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  prayerName: { flex: 1, fontSize: 14, fontWeight: '700' },
  prayerTime: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginLeft: 10, marginTop: 4,
  },
  disclaimer: { fontSize: 11, lineHeight: 16, marginTop: 4, marginBottom: 12 },
  linkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 12, borderWidth: 1, justifyContent: 'center',
  },
  linkBtnText: { fontSize: 13, fontWeight: '700' },
  // Currency
  currencyCard: { borderRadius: 18, padding: 20, borderWidth: 1, marginBottom: 14, alignItems: 'center', marginTop: 12 },
  currencyLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  currencyInput: {
    fontSize: 40, fontWeight: '900', letterSpacing: -1.5,
    borderBottomWidth: 2, paddingBottom: 4, minWidth: 120, textAlign: 'center',
  },
  convertResult: { alignItems: 'center', marginTop: 16, gap: 2 },
  convertNum: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  convertCurrency: { fontSize: 14, fontWeight: '700' },
  convertRate: { fontSize: 11, marginTop: 2 },
  currencyPills: { gap: 8 },
  currencyPill: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 14, borderWidth: 1,
  },
  currencyCode: { fontSize: 14, fontWeight: '800' },
  currencyName: { fontSize: 11 },
  currencyRate: { fontSize: 13, fontWeight: '800', letterSpacing: -0.3 },
  // Zakat
  zakatField: { borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 10 },
  zakatFieldLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  zakatInput: {
    fontSize: 24, fontWeight: '800', letterSpacing: -0.5,
    borderBottomWidth: 2, paddingBottom: 2,
  },
  zakatResult: { borderRadius: 18, padding: 20, borderWidth: 1, marginTop: 4, alignItems: 'center', gap: 4 },
  zakatResultRow: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  zakatResultNum: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  zakatNote: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 8 },
  // Invest
  flagRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8,
  },
  flagLabel: { fontSize: 13, fontWeight: '600', flex: 1 },
  flagCheck: { width: 24, height: 24, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  siResult: { borderRadius: 18, padding: 16, borderWidth: 1, marginTop: 8, gap: 4 },
  siResultMsg: { fontSize: 14, fontWeight: '800', lineHeight: 20 },
  siReason: { fontSize: 12, lineHeight: 18 },
  // Peers
  peerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8,
  },
  peerRank: { fontSize: 20, width: 36, textAlign: 'center' },
  peerNick: { fontSize: 14, fontWeight: '800' },
  peerStreaks: { fontSize: 11, marginTop: 2 },
  peerTotal: { borderRadius: 12, padding: 10, alignItems: 'center', minWidth: 56 },
  peerTotalNum: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  peerTotalLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  peerForm: { borderRadius: 18, padding: 16, borderWidth: 1, marginBottom: 12 },
  peerFormInput: { fontSize: 15, fontWeight: '600', borderBottomWidth: 1, paddingBottom: 6, marginBottom: 4 },
  // Discounts
  discountRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 8,
  },
  discountBadge: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  discountName: { fontSize: 13, fontWeight: '700' },
  discountDetail: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  discountCat: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  // Settings
  settingGroupTitle: {
    fontSize: 10, fontWeight: '800', textTransform: 'uppercase',
    letterSpacing: 1, marginTop: 18, marginBottom: 8,
  },
  settingCard: { borderRadius: 18, padding: 16, borderWidth: 1, marginBottom: 12 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  settingLabel: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  settingSub: { fontSize: 11, lineHeight: 16 },
  toggle: { width: 46, height: 26, borderRadius: 13, borderWidth: 1.5, justifyContent: 'center', flexShrink: 0 },
  toggleDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff' },
  dangerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 14, borderWidth: 1, justifyContent: 'center', marginBottom: 16,
  },
  dangerBtnText: { fontSize: 14, fontWeight: '700' },
  aboutCard: { borderRadius: 18, padding: 18, borderWidth: 1, alignItems: 'center' },
  aboutTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5, marginBottom: 8 },
  aboutSub: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginBottom: 8 },
  aboutVer: { fontSize: 11, fontWeight: '600' },
});
