export const CATEGORIES = [
  { id: "restaurants", label: "المطاعم" },
  { id: "bills", label: "الفواتير" },
  { id: "entertainment", label: "الترفيه" },
  { id: "shopping", label: "التسوق" },
  { id: "transport", label: "المواصلات" },
  { id: "health", label: "الصحة" },
  { id: "other", label: "أخرى" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export type Expense = {
  id: string;
  name: string;
  category: CategoryId;
  amount: number;
  createdAt: number;
};

export type MonthBucket = {
  budget: number;
  expenses: Expense[];
};

const CATEGORY_IDS = new Set<string>(CATEGORIES.map((category) => category.id));

export function isCategoryId(value: string): value is CategoryId {
  return CATEGORY_IDS.has(value);
}

export function categoryLabel(id: CategoryId): string {
  return CATEGORIES.find((category) => category.id === id)?.label ?? "أخرى";
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatMoney(value: number): string {
  const rounded = round2(value);
  const digits = Number.isInteger(rounded) ? 0 : 2;
  return new Intl.NumberFormat("ar-SA-u-nu-latn", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(rounded);
}

export function currentMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function shiftMonth(key: string, delta: number): string {
  const [year, month] = key.split("-").map(Number);
  return currentMonthKey(new Date(year, month - 1 + delta, 1));
}

export function monthLabel(key: string): string {
  if (!/^\d{4}-\d{2}$/.test(key)) return "هذا الشهر";
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("ar", {
    month: "long",
    year: "numeric",
    numberingSystem: "latn",
  }).format(new Date(year, month - 1, 1));
}

export function parseAmount(raw: string): number | null {
  const normalized = raw
    .trim()
    .replace(/,/g, "")
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0 || value > 1_000_000_000) return null;
  return round2(value);
}

export function parseBudget(raw: string): number | null {
  if (raw.trim() === "") return 0;
  const normalized = raw
    .trim()
    .replace(/,/g, "")
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0 || value > 1_000_000_000) return null;
  return round2(value);
}

export function sumExpenses(expenses: Expense[]): number {
  return round2(expenses.reduce((total, expense) => total + expense.amount, 0));
}

export type RankedCategory = {
  id: CategoryId;
  label: string;
  total: number;
};

export function rankCategories(expenses: Expense[]): RankedCategory[] {
  const totals = new Map<CategoryId, number>();
  for (const expense of expenses) {
    totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amount);
  }
  return CATEGORIES.map((category, index) => ({
    id: category.id,
    label: category.label,
    total: round2(totals.get(category.id) ?? 0),
    index,
  }))
    .filter((category) => category.total > 0)
    .sort((a, b) => b.total - a.total || a.index - b.index)
    .map(({ id, label, total }) => ({ id, label, total }));
}

export type Insight = {
  empty: boolean;
  topLabel: string | null;
  topTotal: number;
  share: number;
  sentence: string | null;
};

export function buildInsight(expenses: Expense[]): Insight {
  const ranked = rankCategories(expenses);
  const top = ranked[0];
  if (!top) {
    return { empty: true, topLabel: null, topTotal: 0, share: 0, sentence: null };
  }
  const spent = sumExpenses(expenses);
  const monthly = round2(top.total * 0.2);
  const yearly = round2(monthly * 12);
  const spoken = top.id === "other" ? "مصروفات أخرى" : top.label;
  return {
    empty: false,
    topLabel: spoken,
    topTotal: top.total,
    share: spent > 0 ? Math.round((top.total / spent) * 100) : 0,
    sentence: `أنت تنفق ${formatMoney(top.total)} ريال على ${spoken}. إذا قمت بتخفيض هذا الإنفاق بنسبة 20%، ستوفر ${formatMoney(monthly)} ريال شهرياً، و ${formatMoney(yearly)} ريال سنوياً!`,
  };
}

export function createDemoBucket(): MonthBucket {
  const stamp = Date.UTC(2026, 9, 1);
  const rows: Array<[string, string, CategoryId, number]> = [
    ["demo-restaurants", "وجبات خارج البيت", "restaurants", 900],
    ["demo-bills", "فاتورة الكهرباء", "bills", 320],
    ["demo-fun", "اشتراك ترفيه", "entertainment", 55],
    ["demo-transport", "مواصلات العمل", "transport", 180],
  ];
  return {
    budget: 4000,
    expenses: rows.map(([id, name, category, amount], index) => ({
      id,
      name,
      category,
      amount,
      createdAt: stamp - index,
    })),
  };
}
