// ── Module 1: Impulse-Control / Friction-Injection Engine ──────────────────

export interface ImpulseCheckResult {
  triggered: boolean;
  message: string;
}

export function checkImpulseControl(amountEUR: number): ImpulseCheckResult {
  const hour = new Date().getHours();
  const isLateNight = hour >= 23 || hour < 4;
  const isHighAmount = amountEUR > 20;

  if (isLateNight && isHighAmount) {
    return {
      triggered: true,
      message:
        '⚠️ IMPULSE ALERT: High-risk late-night spending window detected. Friction-injection protocol active.',
    };
  }
  return { triggered: false, message: '✓ Transaction cleared.' };
}

// ── Module 2: Shariah-Compliant Micro-Investing Filter ────────────────────

export interface CompanyData {
  companyName: string;
  ticker: string;
  hasInterestBearingDebt: boolean;
  hasGamblingOrAlcoholRevenue: boolean;
  isCompliant: boolean;
}

export interface ShariahFilterResult {
  compliant: boolean;
  message: string;
  reasons: string[];
}

export function shariahFilter(company: CompanyData): ShariahFilterResult {
  const reasons: string[] = [];

  if (company.hasGamblingOrAlcoholRevenue) {
    reasons.push('Generates revenue from gambling or alcohol');
  }
  if (company.hasInterestBearingDebt) {
    reasons.push('Utilises high interest-bearing (riba) debt');
  }

  if (reasons.length > 0) {
    return {
      compliant: false,
      message: `❌ ${company.ticker} REJECTED — fails Shariah screening benchmarks.`,
      reasons,
    };
  }

  return {
    compliant: true,
    message: `✅ ${company.ticker} APPROVED — compliant with Shariah screening benchmarks.`,
    reasons: [],
  };
}

// ── Module 3: Zakat & Liability Optimizer ─────────────────────────────────

export interface StudentAssets {
  totalSavings: number;
  upcomingTuition: number;
  immediateRent: number;
}

export interface ZakatResult {
  netBalance: number;
  zakatDue: number;
  isZakatRequired: boolean;
}

export function calculateZakat(assets: StudentAssets): ZakatResult {
  const netBalance = assets.totalSavings - assets.upcomingTuition - assets.immediateRent;
  if (netBalance <= 0) {
    return { netBalance: Math.max(netBalance, 0), zakatDue: 0, isZakatRequired: false };
  }
  const zakatDue = netBalance * 0.025;
  return { netBalance, zakatDue, isZakatRequired: true };
}

// ── Module 4: No-Shame Peer Accountability Tracker ────────────────────────

export interface PeerProfile {
  nickname: string;
  mealPrepStreak: number;
  hydrationStreak: number;
}

export interface LeaderboardEntry extends PeerProfile {
  totalStreak: number;
  rank: number;
}

export function buildLeaderboard(profiles: PeerProfile[]): LeaderboardEntry[] {
  return profiles
    .map((p) => ({ ...p, totalStreak: p.mealPrepStreak + p.hydrationStreak, rank: 0 }))
    .sort((a, b) => b.totalStreak - a.totalStreak)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}
