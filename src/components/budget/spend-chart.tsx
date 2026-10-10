import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { formatMoney, rankCategories, sumExpenses, type Expense } from "@/lib/budget/model";

const FILLS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
  "var(--color-chart-7)",
];

export function SpendChart({ expenses }: { expenses: Expense[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const slices = rankCategories(expenses);
  const spent = sumExpenses(expenses);

  return (
    <section className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
      <p className="text-sm font-semibold text-olive">» التوزيع</p>
      <h2 className="mt-1 text-xl font-bold">أين تذهب الميزانية</h2>
      {slices.length === 0 ? (
        <div className="mt-6 grid min-h-56 place-items-center">
          <div className="grid size-44 place-items-center rounded-full bg-line">
            <div className="grid size-28 place-items-center rounded-full bg-surface px-4 text-center text-sm leading-6 text-stone">
              أضف مصروفاً ليظهر المخطط
            </div>
          </div>
        </div>
      ) : (
        <div className="relative mt-2 h-56" dir="ltr">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="total"
                  nameKey="label"
                  innerRadius={68}
                  outerRadius={92}
                  paddingAngle={slices.length > 1 ? 3 : 0}
                  stroke="none"
                  isAnimationActive={false}
                >
                  {slices.map((slice, index) => (
                    <Cell key={slice.id} fill={FILLS[index % FILLS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-full place-items-center">
              <div className="size-44 rounded-full bg-line" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="text-center" dir="rtl">
              <p className="text-xs text-stone">المصروف</p>
              <p className="text-2xl font-bold tabular-nums">{formatMoney(spent)}</p>
            </div>
          </div>
        </div>
      )}
      {slices.length > 0 ? (
        <ul className="mt-2 grid gap-2">
          {slices.map((slice, index) => {
            const share = spent > 0 ? Math.round((slice.total / spent) * 100) : 0;
            return (
              <li key={slice.id} className="flex items-center gap-3 text-sm">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: FILLS[index % FILLS.length] }}
                />
                <span className="min-w-0 flex-1 truncate text-stone">{slice.label}</span>
                <span className="tabular-nums font-semibold">{formatMoney(slice.total)}</span>
                <span className="w-10 text-end tabular-nums text-muted">{share}%</span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
