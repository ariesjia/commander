export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

/** 进化历程用：今天/昨天/X月X日/去年X月X日 */
export function formatDateFriendly(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((today.getTime() - dateOnly.getTime()) / 86400000);

  if (diffDays === 0) return "今天";
  if (diffDays === 1) return "昨天";
  if (diffDays < 7 && diffDays > 0) return `${diffDays}天前`;
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
  }
  return d.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
}

export function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function isThisWeek(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return d >= startOfWeek && d < endOfWeek;
}

/** 使用中国时区 (Asia/Shanghai) 的当天日期，确保每日任务按自然日重置 */
export function getTodayStr(): string {
  return toChinaDateStr(new Date());
}

/** 中国时区日历日加减（用于战斗记录等按自然日对齐） */
export function addCalendarDaysChina(dateStr: string, deltaDays: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const noon = new Date(
    `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T12:00:00+08:00`,
  );
  noon.setDate(noon.getDate() + deltaDays);
  return toChinaDateStr(noon);
}

/** 将 Date 转为中国时区的日期字符串 YYYY-MM-DD */
export function toChinaDateStr(date: Date): string {
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

/** 报告用：根据 dateStr (YYYY-MM-DD) 和 period，用中国时区计算 [start, end)，返回 UTC Date */
export function getDateRangeChina(period: "week" | "month", dateStr: string): { start: Date; end: Date } {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const dayOfWeek = date.getUTCDay();

  if (period === "week") {
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(date);
    monday.setUTCDate(date.getUTCDate() + diff);
    const my = monday.getUTCFullYear();
    const mm = String(monday.getUTCMonth() + 1).padStart(2, "0");
    const md = String(monday.getUTCDate()).padStart(2, "0");
    const start = new Date(`${my}-${mm}-${md}T00:00:00+08:00`);
    const endDate = new Date(monday);
    endDate.setUTCDate(monday.getUTCDate() + 7);
    const ey = endDate.getUTCFullYear();
    const em = String(endDate.getUTCMonth() + 1).padStart(2, "0");
    const ed = String(endDate.getUTCDate()).padStart(2, "0");
    const end = new Date(`${ey}-${em}-${ed}T00:00:00+08:00`);
    return { start, end };
  }
  const start = new Date(`${y}-${String(m).padStart(2, "0")}-01T00:00:00+08:00`);
  const nextMonth = m === 12 ? 1 : m + 1;
  const nextYear = m === 12 ? y + 1 : y;
  const end = new Date(`${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00+08:00`);
  return { start, end };
}

/** 使用中国时区的本周一日期 */
export function getWeekStartStr(): string {
  const todayStr = getTodayStr();
  const [y, m, d] = todayStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const dayOfWeek = date.getUTCDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() + diff);
  const my = monday.getUTCFullYear();
  const mm = String(monday.getUTCMonth() + 1).padStart(2, "0");
  const md = String(monday.getUTCDate()).padStart(2, "0");
  return `${my}-${mm}-${md}`;
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
