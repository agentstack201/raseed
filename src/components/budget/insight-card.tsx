import { buildInsight, formatMoney, type Expense } from "@/lib/budget/model";

export function InsightCard({ expenses, remaining }: { expenses: Expense[]; remaining: number }) {
  const insight = buildInsight(expenses);

  return (
    <section className="relative overflow-hidden rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-3 start-2 select-none text-8xl leading-none text-olive/15"
      >
        «
      </span>
      <p className="text-sm font-semibold text-olive">» التوجيه المالي</p>
      {insight.empty || !insight.sentence || !insight.topLabel ? (
        <>
          <h2 className="mt-3 text-xl font-bold leading-snug">أضف مصروفاتك ليبدأ التوجيه</h2>
          <p className="mt-3 text-base leading-7 text-stone">
            عندما تسجّل ما تصرفه، يحدد رصيد الفئة الأعلى ويحسب كم توفر إذا خفّضتها بنسبة 20% هذا الشهر
            وطوال السنة.
          </p>
        </>
      ) : (
        <>
          <h2 className="mt-3 text-xl font-bold leading-snug">
            أكثر شيء يخسر ميزانيتك هو: <span className="text-olive">{insight.topLabel}</span>
          </h2>
          <p className="mt-2 text-sm text-stone">تشكّل {insight.share}% من مصروفات هذا الشهر.</p>
          <p className="mt-4 text-base leading-8 text-ink">{insight.sentence}</p>
          {remaining < 0 ? (
            <p className="mt-3 text-sm font-medium text-over">
              تجاوزت الميزانية بمقدار {formatMoney(Math.abs(remaining))} ريال.
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
