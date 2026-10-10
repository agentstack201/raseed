import { ChevronLeft, ChevronRight } from "lucide-react";
import { ExpensePanel } from "@/components/budget/expense-panel";
import { InsightCard } from "@/components/budget/insight-card";
import { InstallBanner } from "@/components/budget/install-banner";
import { SpendChart } from "@/components/budget/spend-chart";
import {
  currentMonthKey,
  formatMoney,
  monthLabel,
  shiftMonth,
  sumExpenses,
} from "@/lib/budget/model";
import { clearMonth, monthView, setActiveMonth, useBudgetState } from "@/lib/budget/store";

export function BudgetApp() {
  const state = useBudgetState();
  const { key, bucket, hydrated } = monthView(state);
  const spent = sumExpenses(bucket.expenses);
  const remaining = bucket.budget - spent;
  const ratio = bucket.budget > 0 ? spent / bucket.budget : 0;
  const percent = Math.round(ratio * 100);
  const over = bucket.budget > 0 && remaining < 0;
  const sample = hydrated && state.sampleMonth === key;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-bg text-ink">
      <Ornaments />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 pt-8 sm:px-6 sm:pt-10">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-sm font-semibold text-olive">» » ميزانية هادئة</p>
            <h1 className="mt-2 text-5xl font-bold leading-none tracking-tight sm:text-6xl">رصيد</h1>
            <p className="mt-3 text-base leading-7 text-stone">
              ميزانيتك الشخصية وادخارك لهذا الشهر. كل شيء يُحفظ على جهازك، بلا حساب وبدون سيرفر.
            </p>
          </div>
          <MonthSwitcher monthKey={key} hydrated={hydrated} />
        </header>

        <InstallBanner />

        {sample ? (
          <div className="flex flex-col gap-3 rounded-card border border-line bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-stone">
              هذه أرقام للتجربة حتى ترى التوجيه: المطاعم 900 ريال. امسحها عندما تبدأ ميزانيتك.
            </p>
            <button
              type="button"
              onClick={clearMonth}
              className="h-11 shrink-0 rounded-xl px-3 text-sm font-semibold text-olive hover:bg-bg"
            >
              مسح المثال
            </button>
          </div>
        ) : null}

        <section className="grid grid-cols-3 gap-2 sm:gap-3" aria-label="ملخص الشهر">
          <Stat label="الميزانية" value={bucket.budget} />
          <Stat label="المصروفات" value={spent} />
          <Stat
            label={over ? "العجز" : "المتبقي"}
            value={Math.abs(remaining)}
            emphasize={!over}
            alert={over}
          />
        </section>

        <section className="rounded-card border border-line bg-surface px-5 py-4 shadow-card">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-stone">استهلاك الميزانية</h2>
            <p className="text-sm tabular-nums text-ink">
              {bucket.budget > 0 ? `${formatMoney(spent)} من ${formatMoney(bucket.budget)} · ${percent}%` : "لم تُحدَّد ميزانية بعد"}
            </p>
          </div>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-line"
            role="meter"
            aria-label="نسبة استهلاك الميزانية"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={bucket.budget > 0 ? Math.min(percent, 100) : 0}
          >
            <div
              className={over ? "h-full rounded-full bg-over" : "h-full rounded-full bg-olive"}
              style={{ width: `${bucket.budget > 0 ? Math.min(percent, 100) : 0}%` }}
            />
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-12">
          <div className="order-2 grid min-w-0 content-start gap-4 lg:order-1 lg:col-span-7">
            <ExpensePanel monthKey={key || "pending"} bucket={bucket} hydrated={hydrated} />
          </div>
          <div className="order-1 grid min-w-0 content-start gap-4 lg:order-2 lg:col-span-5">
            <InsightCard expenses={bucket.expenses} remaining={bucket.budget > 0 ? remaining : 0} />
            <SpendChart expenses={bucket.expenses} />
          </div>
        </div>
      </div>

      <footer className="safe-bottom relative mt-12 bg-stone text-surface">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm">رصيد · بياناتك تبقى على هذا الجهاز فقط</p>
          <p className="text-sm text-sand">
            {hydrated ? monthLabel(key) : "هذا الشهر"}
            {" · "}
            {bucket.budget > 0
              ? `${over ? "العجز" : "المدخر"} ${formatMoney(Math.abs(remaining))} ريال`
              : `المصروف ${formatMoney(spent)} ريال`}
          </p>
        </div>
      </footer>
    </div>
  );
}

function Stat({
  label,
  value,
  emphasize = false,
  alert = false,
}: {
  label: string;
  value: number;
  emphasize?: boolean;
  alert?: boolean;
}) {
  return (
    <article
      className={
        emphasize
          ? "rounded-card border border-olive/30 bg-surface p-3 shadow-card sm:p-5"
          : "rounded-card border border-line bg-surface p-3 shadow-card sm:p-5"
      }
    >
      <p className="text-xs text-stone sm:text-sm">{label}</p>
      <p
        className={
          alert
            ? "mt-2 text-xl font-bold text-over sm:text-3xl"
            : emphasize
              ? "mt-2 text-xl font-bold text-olive sm:text-3xl"
              : "mt-2 text-xl font-bold text-ink sm:text-3xl"
        }
      >
        <span dir="ltr" className="tabular-nums">
          {formatMoney(value)}
        </span>
      </p>
      <p className="mt-1 text-xs text-muted sm:text-sm">ريال</p>
    </article>
  );
}

function MonthSwitcher({ monthKey, hydrated }: { monthKey: string; hydrated: boolean }) {
  const label = hydrated ? monthLabel(monthKey) : "…";
  const showToday = hydrated && monthKey !== currentMonthKey();

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="grid size-11 place-items-center rounded-full border border-line bg-surface text-ink hover:border-olive disabled:opacity-40"
          aria-label="الشهر السابق"
          disabled={!hydrated}
          onClick={() => setActiveMonth(shiftMonth(monthKey, -1))}
        >
          <ChevronRight className="size-5" strokeWidth={1.75} />
        </button>
        <p className="min-w-36 text-center text-base font-semibold">{label}</p>
        <button
          type="button"
          className="grid size-11 place-items-center rounded-full border border-line bg-surface text-ink hover:border-olive disabled:opacity-40"
          aria-label="الشهر التالي"
          disabled={!hydrated}
          onClick={() => setActiveMonth(shiftMonth(monthKey, 1))}
        >
          <ChevronLeft className="size-5" strokeWidth={1.75} />
        </button>
      </div>
      {showToday ? (
        <button
          type="button"
          className="text-sm font-medium text-olive"
          onClick={() => setActiveMonth(currentMonthKey())}
        >
          العودة لهذا الشهر
        </button>
      ) : null}
    </div>
  );
}

function Ornaments() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-24 -end-16 size-64 rounded-full bg-olive-soft/10" />
      <div className="absolute top-8 end-8 hidden size-16 rounded-full border border-olive/25 sm:block" />
      <div className="absolute top-16 end-28 hidden size-3 rounded-full bg-olive/40 sm:block" />
      <div className="absolute -bottom-24 -start-16 size-64 rounded-full border border-line" />
      <svg className="absolute top-0 end-0 hidden text-olive/25 sm:block" width="92" height="92" viewBox="0 0 92 92">
        <path d="M92 0H58V8H84V36H92Z" fill="currentColor" />
        <path d="M92 16H72V24H84V44H92Z" fill="currentColor" opacity="0.45" />
      </svg>
    </div>
  );
}
