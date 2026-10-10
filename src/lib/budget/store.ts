import { useSyncExternalStore } from "react";
import {
  createDemoBucket,
  currentMonthKey,
  isCategoryId,
  type CategoryId,
  type Expense,
  type MonthBucket,
} from "@/lib/budget/model";

const KEY = "raseed-budget-v1";

export type BudgetState = {
  activeMonth: string;
  sampleMonth: string | null;
  months: Record<string, MonthBucket>;
};

const SERVER_STATE: BudgetState = { activeMonth: "", sampleMonth: null, months: {} };

let state: BudgetState = SERVER_STATE;
const listeners = new Set<() => void>();
let hydrated = false;

function emptyBucket(): MonthBucket {
  return { budget: 0, expenses: [] };
}

function sanitizeMonths(input: unknown): Record<string, MonthBucket> {
  if (!input || typeof input !== "object") return {};
  const months: Record<string, MonthBucket> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!/^\d{4}-\d{2}$/.test(key) || !value || typeof value !== "object") continue;
    const record = value as { budget?: unknown; expenses?: unknown };
    const budget =
      typeof record.budget === "number" && Number.isFinite(record.budget) && record.budget >= 0
        ? record.budget
        : 0;
    const expenses: Expense[] = [];
    if (Array.isArray(record.expenses)) {
      for (const item of record.expenses) {
        if (!item || typeof item !== "object") continue;
        const expense = item as Partial<Expense>;
        if (typeof expense.id !== "string" || typeof expense.name !== "string") continue;
        if (typeof expense.category !== "string" || !isCategoryId(expense.category)) continue;
        if (typeof expense.amount !== "number" || !Number.isFinite(expense.amount) || expense.amount <= 0) {
          continue;
        }
        expenses.push({
          id: expense.id,
          name: expense.name.slice(0, 40),
          category: expense.category,
          amount: expense.amount,
          createdAt: typeof expense.createdAt === "number" ? expense.createdAt : 0,
        });
      }
    }
    months[key] = { budget, expenses };
  }
  return months;
}

function demoState(): BudgetState {
  const key = currentMonthKey();
  return { activeMonth: key, sampleMonth: key, months: { [key]: createDemoBucket() } };
}

function ensureClient() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      state = demoState();
      localStorage.setItem(KEY, JSON.stringify(state));
      return;
    }
    const parsed = JSON.parse(raw) as Partial<BudgetState>;
    const activeMonth =
      typeof parsed.activeMonth === "string" && /^\d{4}-\d{2}$/.test(parsed.activeMonth)
        ? parsed.activeMonth
        : currentMonthKey();
    const sampleMonth =
      typeof parsed.sampleMonth === "string" && /^\d{4}-\d{2}$/.test(parsed.sampleMonth)
        ? parsed.sampleMonth
        : null;
    state = { activeMonth, sampleMonth, months: sanitizeMonths(parsed.months) };
  } catch {
    state = demoState();
  }
}

function commit(next: BudgetState) {
  state = next;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* Storage can be full or blocked; the session still works. */
    }
  }
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot() {
  ensureClient();
  return state;
}

export function getServerSnapshot() {
  return SERVER_STATE;
}

export function useBudgetState() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function monthView(current: BudgetState): { key: string; bucket: MonthBucket; hydrated: boolean } {
  if (!current.activeMonth) return { key: "", bucket: emptyBucket(), hydrated: false };
  return {
    key: current.activeMonth,
    bucket: current.months[current.activeMonth] ?? emptyBucket(),
    hydrated: true,
  };
}

function editMonth(recipe: (bucket: MonthBucket) => MonthBucket) {
  const current = getSnapshot();
  const key = current.activeMonth || currentMonthKey();
  const bucket = current.months[key] ?? emptyBucket();
  commit({
    activeMonth: key,
    sampleMonth: current.sampleMonth === key ? null : current.sampleMonth,
    months: { ...current.months, [key]: recipe(bucket) },
  });
}

export function setActiveMonth(key: string) {
  if (!/^\d{4}-\d{2}$/.test(key)) return;
  const current = getSnapshot();
  if (current.activeMonth === key) return;
  commit({ ...current, activeMonth: key });
}

export function setBudget(amount: number) {
  editMonth((bucket) => ({ ...bucket, budget: amount }));
}

export function addExpense(input: { name: string; category: CategoryId; amount: number }) {
  editMonth((bucket) => ({
    ...bucket,
    expenses: [
      {
        id: crypto.randomUUID(),
        name: input.name,
        category: input.category,
        amount: input.amount,
        createdAt: Date.now(),
      },
      ...bucket.expenses,
    ],
  }));
}

export function removeExpense(id: string) {
  editMonth((bucket) => ({
    ...bucket,
    expenses: bucket.expenses.filter((expense) => expense.id !== id),
  }));
}

export function clearMonth() {
  editMonth(() => emptyBucket());
}

export function loadDemo() {
  const current = getSnapshot();
  const key = current.activeMonth || currentMonthKey();
  commit({
    activeMonth: key,
    sampleMonth: key,
    months: { ...current.months, [key]: createDemoBucket() },
  });
}
