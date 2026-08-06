export type LeetCodeStats = {
  username: string;
  total: number;
  easy: number;
  medium: number;
  hard: number;
  easyTotal: number;
  mediumTotal: number;
  hardTotal: number;
  ranking: number | null;
  streak: number;
  activeDays: number;
  calendar: { date: string; count: number }[];
  live: boolean;
};

// Public LeetCode proxy API — no CORS restrictions
const BASE = "https://alfa-leetcode-api.onrender.com";

function emptyCalendar(): { date: string; count: number }[] {
  const days: { date: string; count: number }[] = [];
  const now = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }
  return days;
}

function buildCalendar(submissionCalendar: string): { date: string; count: number }[] {
  try {
    const raw = JSON.parse(submissionCalendar) as Record<string, number>;
    const byDate = new Map<string, number>();
    for (const [ts, count] of Object.entries(raw)) {
      const key = new Date(Number(ts) * 1000).toISOString().slice(0, 10);
      byDate.set(key, (byDate.get(key) ?? 0) + count);
    }
    return emptyCalendar().map((d) => ({ date: d.date, count: byDate.get(d.date) ?? 0 }));
  } catch {
    return emptyCalendar();
  }
}

function mockCalendar(): { date: string; count: number }[] {
  const days: { date: string; count: number }[] = [];
  const now = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    // Create a realistic active-day distribution (active on ~30% of days)
    // Use a deterministic pattern based on i so it doesn't flicker on every render
    const active = (i % 7 === 1 || i % 7 === 3 || i % 11 === 0 || i % 19 === 5) && i % 3 !== 0;
    const count = active ? (i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1) : 0;
    days.push({ date: d.toISOString().slice(0, 10), count });
  }
  return days;
}

export async function getLeetCodeStats(username = "chetanprajapat07"): Promise<LeetCodeStats> {
  const mockCal = mockCalendar();
  const mockActiveCount = mockCal.filter((d) => d.count > 0).length;

  const fallback: LeetCodeStats = {
    username,
    total: 206,
    easy: 152,
    medium: 50,
    hard: 4,
    easyTotal: 958,
    mediumTotal: 2095,
    hardTotal: 960,
    ranking: 114207,
    streak: 14,
    activeDays: mockActiveCount,
    calendar: mockCal,
    live: false,
  };

  try {
    // Fetch profile stats + calendar in parallel
    // Correct endpoints: /userProfile/{username} and /{username}/calendar
    const [profileRes, calendarRes] = await Promise.all([
      fetch(`${BASE}/userProfile/${username}`),
      fetch(`${BASE}/${username}/calendar`),
    ]);

    if (!profileRes.ok) return fallback;

    type ProfileData = {
      ranking?: number;
      totalSolved?: number;
      easySolved?: number;
      mediumSolved?: number;
      hardSolved?: number;
      totalEasy?: number;
      totalMedium?: number;
      totalHard?: number;
    };

    type CalendarData = {
      submissionCalendar?: string;
      totalActiveDays?: number;
      streak?: number;
      activeYears?: number[];
    };

    const profile = (await profileRes.json()) as ProfileData;

    let calendarData: CalendarData = {};
    if (calendarRes.ok) {
      calendarData = (await calendarRes.json()) as CalendarData;
    }

    const calendar = calendarData.submissionCalendar
      ? buildCalendar(calendarData.submissionCalendar)
      : emptyCalendar();

    return {
      username,
      total: profile.totalSolved ?? fallback.total,
      easy: profile.easySolved ?? fallback.easy,
      medium: profile.mediumSolved ?? fallback.medium,
      hard: profile.hardSolved ?? fallback.hard,
      easyTotal: profile.totalEasy ?? fallback.easyTotal,
      mediumTotal: profile.totalMedium ?? fallback.mediumTotal,
      hardTotal: profile.totalHard ?? fallback.hardTotal,
      ranking: profile.ranking ?? null,
      streak: calendarData.streak ?? 0,
      activeDays: calendarData.totalActiveDays ?? 0,
      calendar,
      live: true,
    };
  } catch {
    return fallback;
  }
}
