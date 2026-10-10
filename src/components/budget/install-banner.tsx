import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const HIDE_KEY = "raseed-install-hide";

export function InstallBanner() {
  const [open, setOpen] = useState(true);
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (localStorage.getItem(HIDE_KEY) === "1") setOpen(false);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        (navigator as Navigator & { standalone?: boolean }).standalone === true);
    if (standalone) setOpen(false);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
      setOpen(true);
    };
    const onInstalled = () => setOpen(false);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!open) return null;

  async function install() {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") setOpen(false);
    setPromptEvent(null);
  }

  function dismiss() {
    localStorage.setItem(HIDE_KEY, "1");
    setOpen(false);
  }

  return (
    <section className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-bg text-olive">
          <Download className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold">ثبّت رصيد على جوالك</h2>
          <p className="mt-1 text-sm leading-6 text-stone">
            على الآيفون من سفاري: مشاركة ثم «إضافة إلى الشاشة الرئيسية». على أندرويد: «تثبيت التطبيق» من
            قائمة المتصفح. يفتح بعد ذلك كتطبيق، وبياناتك تبقى على الجهاز.
          </p>
          {promptEvent ? (
            <button
              type="button"
              onClick={() => void install()}
              className="mt-3 inline-flex h-11 items-center justify-center rounded-xl bg-olive px-4 text-sm font-semibold text-surface hover:opacity-90"
            >
              تثبيت الآن
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="grid size-11 shrink-0 place-items-center rounded-xl text-stone hover:bg-bg"
          aria-label="إخفاء تنبيه التثبيت"
        >
          <X className="size-5" strokeWidth={1.75} />
        </button>
      </div>
    </section>
  );
}
