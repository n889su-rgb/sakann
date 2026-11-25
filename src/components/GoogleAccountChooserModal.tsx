"use client";

import { useState, useEffect } from "react";
import { X, UserPlus, Loader2, ArrowRight } from "lucide-react";

interface GoogleAccountChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GoogleAccountChooserModal({ isOpen, onClose }: GoogleAccountChooserModalProps) {
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState("/");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");
      if (redirect) setRedirectUrl(redirect);
    }
  }, []);

  if (!isOpen) return null;

  // The user's accounts matching their exact uploaded Google Account Chooser screen
  const accounts = [
    {
      name: "mohamed siddig",
      email: "mohamedsiddig375@gmail.com",
      avatarLetter: "M",
      avatarBg: "bg-amber-600",
    },
    {
      name: "Mark Zone",
      email: "n889su@gmail.com",
      avatarLetter: "M",
      avatarBg: "bg-slate-600",
    },
    {
      name: "Fawzen",
      email: "fawzen69@gmail.com",
      avatarLetter: "F",
      avatarBg: "bg-orange-600",
    },
    {
      name: "elraya awad",
      email: "elrayaawad@gmail.com",
      avatarLetter: "E",
      avatarBg: "bg-purple-600",
    },
  ];

  // 1-Click Instant Login (Exactly like other modern websites)
  const handleSelectAccount = async (name: string, email: string) => {
    setLoadingEmail(email);
    setError(null);

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل تسجيل الدخول بحساب Google");
      }

      // If user hasn't completed phone number, redirect to complete profile
      if (!data.isProfileComplete) {
        window.location.href = "/complete-profile";
      } else {
        window.location.href = redirectUrl || "/";
      }
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء تسجيل الدخول");
      setLoadingEmail(null);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.includes("@")) {
      setError("يرجى إدخال بريد إلكتروني صحيح");
      return;
    }
    const name = customEmail.split("@")[0];
    handleSelectAccount(name, customEmail.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      {/* Google Native Style Dark Dialog (Pixel-perfect to Chrome / Google Antigravity) */}
      <div className="bg-[#1f1f1f] text-slate-100 rounded-3xl max-w-sm w-full shadow-2xl border border-slate-800 overflow-hidden text-right">
        {/* Header */}
        <div className="p-5 pb-3 border-b border-slate-800/80 flex items-start justify-between">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-right">
            {/* Colorful Google G */}
            <div className="flex items-center justify-end mb-2">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-white">اختيار حساب</h2>
            <p className="text-xs text-slate-400 mt-0.5">المتابعة إلى بَيْت BAYT</p>
          </div>
        </div>

        {error && (
          <div className="mx-5 mt-3 p-3 bg-red-950/80 border border-red-800 rounded-2xl text-red-200 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* 1-Click Accounts List */}
        {!showCustomInput ? (
          <div className="divide-y divide-slate-800/80">
            {accounts.map((acc) => (
              <button
                key={acc.email}
                disabled={loadingEmail !== null}
                onClick={() => handleSelectAccount(acc.name, acc.email)}
                className="w-full p-4 hover:bg-slate-800/70 active:bg-slate-800 transition flex items-center justify-between text-right group cursor-pointer"
              >
                <div>
                  {loadingEmail === acc.email ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري الدخول...</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500 group-hover:text-emerald-400 transition font-medium">
                      تسجيل دخول
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div>
                    <span className="font-semibold text-sm text-slate-100 block group-hover:text-emerald-400 transition">
                      {acc.name}
                    </span>
                    <span className="text-xs text-slate-400 dir-ltr block text-right font-mono">
                      {acc.email}
                    </span>
                  </div>

                  <div
                    className={`w-10 h-10 rounded-full ${acc.avatarBg} text-white font-bold flex items-center justify-center text-sm shadow-md shrink-0`}
                  >
                    {acc.avatarLetter}
                  </div>
                </div>
              </button>
            ))}

            {/* Use Another Google Account */}
            <button
              type="button"
              onClick={() => setShowCustomInput(true)}
              className="w-full p-4 hover:bg-slate-800/70 transition flex items-center justify-end gap-3 text-right text-emerald-400 font-bold text-xs"
            >
              <span>استخدام حساب Google آخر...</span>
              <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </div>
            </button>
          </div>
        ) : (
          /* Simple 1-Step Email Input */
          <form onSubmit={handleCustomSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                البريد الإلكتروني لحساب Google (Gmail)
              </label>
              <input
                type="email"
                required
                autoFocus
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 p-3 rounded-2xl text-sm font-semibold text-white dir-ltr text-right focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={loadingEmail !== null}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-2xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2"
              >
                {loadingEmail ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري الدخول...
                  </>
                ) : (
                  "متابعة الدخول"
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowCustomInput(false)}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition flex items-center gap-1"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                رجوع
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="p-3.5 bg-black/40 border-t border-slate-800/80 text-center text-[10px] text-slate-500">
          تطبيق آمن ومشفر للمتابعة إلى بَيْت عبر حساب Google
        </div>
      </div>
    </div>
  );
}
