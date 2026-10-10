import { useEffect, useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { CategoryIcon } from "@/components/budget/category-icon";
import {
  CATEGORIES,
  categoryLabel,
  formatMoney,
  isCategoryId,
  parseAmount,
  parseBudget,
  type CategoryId,
  type MonthBucket,
} from "@/lib/budget/model";
import { addExpense, clearMonth, loadDemo, removeExpense, setBudget } from "@/lib/budget/store";

const controlClass =
  "h-12 w-full rounded-xl border border-line bg-bg px-3 text-base text-ink outline-none transition-colors placeholder:text-muted focus-visible:border-olive focus-visible:bg-surface";

const primaryClass =
  "inline-flex h-12 items-center justify-center rounded-xl bg-olive px-4 text-base font-semibold text-surface transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive disabled:opacity-40";

export function ExpensePanel({
  monthKey,
  bucket,
  hydrated,
}: {
  monthKey: string;
  bucket: MonthBucket;
  hydrated: boolean;
}) {
  const empty = bucket.budget === 0 && bucket.expenses.length === 0;

  return (
    <div className="grid gap-4">
      <BudgetEditor key={`budget-${monthKey}`} budget={bucket.budget} ready={hydrated} />
      <ExpenseForm key={`expense-${monthKey}`} ready={hydrated} />
      <ExpenseList bucket={bucket} empty={empty} ready={hydrated} />
    </div>
  );
}

function BudgetEditor({ budget, ready }: { budget: number; ready: boolean }) {
  const [draft, setDraft] = useState(budget ? String(budget) : "");
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!dirty) setDraft(budget ? String(budget) : "");
  }, [budget, dirty]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const amount = parseBudget(draft);
    if (amount === null) {
      setError("أدخل ميزانية برقم صحيح، مثل 4000.");
      setMessage("");
      return;
    }
    setBudget(amount);
    setDirty(false);
    setError("");
    setMessage(amount === 0 ? "أُزيلت ميزانية هذا الشهر." : "تم حفظ الميزانية على هذا الجهاز.");
  }

  return (
    <section className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
      <p className="text-sm font-semibold text-olive">» الميزانية</p>
      <h2 className="mt-1 text-xl font-bold">المتاح هذا الشهر</h2>
      <form onSubmit={onSubmit} className="mt-4 grid gap-3">
        <label className="grid gap-2 text-sm font-medium text-stone" htmlFor="budget">
          إجمالي الميزانية بالريال
          <input
            id="budget"
            inputMode="decimal"
            dir="ltr"
            className={`${controlClass} text-end`}
            value={draft}
            placeholder="4000"
            disabled={!ready}
            onChange={(event) => {
              setDraft(event.target.value);
              setDirty(true);
              setError("");
              setMessage("");
            }}
          />
        </label>
        {error ? (
          <p className="text-sm text-over" role="alert">
            {error}
          </p>
        ) : null}
        {message ? <p className="text-sm text-olive">{message}</p> : null}
        <button type="submit" className={primaryClass} disabled={!ready}>
          حفظ الميزانية
        </button>
      </form>
    </section>
  );
}

function ExpenseForm({ ready }: { ready: boolean }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<CategoryId>("restaurants");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("اكتب اسم المصروف.");
      setNotice("");
      return;
    }
    const value = parseAmount(amount);
    if (value === null) {
      setError("أدخل مبلغاً أكبر من صفر.");
      setNotice("");
      return;
    }
    addExpense({ name: trimmed.slice(0, 40), category, amount: value });
    setName("");
    setAmount("");
    setError("");
    setNotice("أُضيف المصروف وحُفظ على جهازك.");
  }

  return (
    <section className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
      <p className="text-sm font-semibold text-olive">» مصروف جديد</p>
      <h2 className="mt-1 text-xl font-bold">سجّل ما صرفته</h2>
      <form onSubmit={onSubmit} className="mt-4 grid gap-3">
        <label className="grid gap-2 text-sm font-medium text-stone" htmlFor="expense-name">
          اسم المصروف
          <input
            id="expense-name"
            className={controlClass}
            value={name}
            maxLength={40}
            placeholder="عشاء، فاتورة، اشتراك…"
            disabled={!ready}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-stone" htmlFor="expense-category">
          الفئة
          <select
            id="expense-category"
            className={controlClass}
            value={category}
            disabled={!ready}
            onChange={(event) => {
              if (isCategoryId(event.target.value)) setCategory(event.target.value);
            }}
          >
            {CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium text-stone" htmlFor="expense-amount">
          المبلغ
          <input
            id="expense-amount"
            inputMode="decimal"
            dir="ltr"
            className={`${controlClass} text-end`}
            value={amount}
            placeholder="900"
            disabled={!ready}
            onChange={(event) => setAmount(event.target.value)}
          />
        </label>
        {error ? (
          <p className="text-sm text-over" role="alert">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="text-sm text-olive" role="status">
            {notice}
          </p>
        ) : null}
        <button type="submit" className={primaryClass} disabled={!ready}>
          إضافة المصروف
        </button>
      </form>
    </section>
  );
}

function ExpenseList({ bucket, empty, ready }: { bucket: MonthBucket; empty: boolean; ready: boolean }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <section className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-olive">» السجل</p>
          <h2 className="mt-1 text-xl font-bold">المصروفات</h2>
        </div>
        <p className="text-sm tabular-nums text-stone">{bucket.expenses.length}</p>
      </div>

      {bucket.expenses.length === 0 ? (
        <div className="mt-5 rounded-xl bg-bg px-4 py-6">
          <p className="font-medium">لا مصروفات هذا الشهر.</p>
          <p className="mt-1 text-sm leading-6 text-stone">أضف أول مصروف، أو حمّل مثالاً لترى التوجيه المالي.</p>
          <button type="button" className={`${primaryClass} mt-4`} disabled={!ready} onClick={loadDemo}>
            جرّب مثالاً
          </button>
        </div>
      ) : (
        <ul className="mt-4">
          {bucket.expenses.map((expense) => {
            const confirming = pendingId === expense.id;
            return (
              <li key={expense.id} className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-bg text-olive">
                  <CategoryIcon id={expense.category} className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{expense.name}</p>
                  <p className="text-sm text-muted">{categoryLabel(expense.category)}</p>
                </div>
                <p className="shrink-0 font-semibold tabular-nums" dir="ltr">
                  {formatMoney(expense.amount)}
                </p>
                {confirming ? (
                  <button
                    type="button"
                    className="h-11 shrink-0 rounded-xl px-3 text-sm font-semibold text-over hover:bg-bg"
                    onClick={() => {
                      removeExpense(expense.id);
                      setPendingId(null);
                    }}
                  >
                    تأكيد
                  </button>
                ) : (
                  <button
                    type="button"
                    className="grid size-11 shrink-0 place-items-center rounded-xl text-stone hover:bg-bg hover:text-over"
                    aria-label={`حذف ${expense.name}`}
                    onClick={() => setPendingId(expense.id)}
                  >
                    <Trash2 className="size-5" strokeWidth={1.75} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!empty ? (
        <div className="mt-4">
          {confirmClear ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="h-11 rounded-xl px-3 text-sm font-semibold text-over hover:bg-bg"
                onClick={() => {
                  clearMonth();
                  setConfirmClear(false);
                }}
              >
                تأكيد مسح الشهر
              </button>
              <button
                type="button"
                className="h-11 rounded-xl px-3 text-sm text-stone hover:bg-bg"
                onClick={() => setConfirmClear(false)}
              >
                تراجع
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="h-11 text-sm text-stone underline decoration-line underline-offset-4"
              onClick={() => setConfirmClear(true)}
            >
              مسح بيانات هذا الشهر
            </button>
          )}
        </div>
      ) : null}
    </section>
  );
}
