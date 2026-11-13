"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, ArrowRight, Loader2, RefreshCw, AlertCircle, CheckCircle2, Clock } from "lucide-react";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

  useEffect(() => {
    const qEmail = searchParams.get("email");
    const storedEmail = typeof window !== "undefined" ? sessionStorage.getItem("sakan_reset_email") : null;
    const resolvedEmail = qEmail || storedEmail || "";
    if (resolvedEmail) {
      setEmail(resolvedEmail);
    }
  }, [searchParams]);

  // 5-Minute Countdown Timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(clean);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail) {
      setError("يرجى إدخال البريد الإلكتروني أولاً");
      return;
    }

    if (otp.length !== 6) {
      setError("يرجى إدخال رمز التحقق كاملاً المكون من 6 أرقام");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          otp: otp.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "رمز التحقق غير صحيح");
      }

      setSuccessMsg("تم التحقق بنجاح! جاري تحويلك لتعيين كلمة المرور...");

      if (typeof window !== "undefined") {
        sessionStorage.setItem("sakan_reset_token", data.resetToken);
        sessionStorage.setItem("sakan_reset_email", targetEmail);
      }

      setTimeout(() => {
        router.push("/reset-password");
      }, 500);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء التحقق من الرمز");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const targetEmail = email.trim().toLowerCase();
    if (resending || !targetEmail) return;
    setError(null);
    setSuccessMsg(null);
    setResending(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل إعادة إرسال الرمز");
      }

      setTimeLeft(300); // Reset timer to 5 mins
      setOtp("");
      setSuccessMsg("تم إرسال رمز تحقق جديد إلى بريدك الإلكتروني بنجاح!");
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء إعادة إرسال الرمز");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pt-6 pb-16 px-4">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">أدخل رمز التحقق (OTP)</h1>
            <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto mt-1 leading-relaxed">
              تم إرسال رمز تحقق مكوّن من 6 أرقام إلى بريدك الإلكتروني:
            </p>
            {email ? (
              <span className="inline-block mt-1 text-xs font-bold text-brand-900 bg-slate-100 px-3 py-1 rounded-full dir-ltr">
                {email}
              </span>
            ) : (
              <div className="mt-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded-xl text-xs font-semibold dir-ltr text-right"
                />
              </div>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-red-800 text-xs font-bold animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 text-center">
              رمز التحقق (6 أرقام)
            </label>
            <div className="relative max-w-[280px] mx-auto">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                value={otp}
                onChange={handleOtpChange}
                placeholder="------"
                className="w-full bg-slate-50 border-2 border-slate-200 py-3 px-4 rounded-2xl text-2xl font-black text-center tracking-[0.5em] text-brand-950 focus:ring-2 focus:ring-brand-700 focus:bg-white focus:border-brand-600 transition font-mono"
                disabled={loading}
                autoFocus
              />
            </div>
          </div>

          {/* Timer and Countdown */}
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 pt-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>صلاحية الرمز:</span>
            <span className={`font-mono font-bold ${timeLeft < 60 ? "text-red-600 animate-pulse" : "text-brand-800"}`}>
              {formatTime(timeLeft)}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full py-3.5 bg-brand-800 hover:bg-brand-700 active:scale-98 text-white rounded-2xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري التحقق...</span>
              </>
            ) : (
              <span>تأكيد الرمز والمتابعة</span>
            )}
          </button>
        </form>

        {/* Resend Action */}
        <div className="pt-2 text-center space-y-2 border-t border-slate-100">
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>لم يصلك الرمز؟</span>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resending || timeLeft > 240}
              className="text-xs font-bold text-brand-800 hover:underline disabled:text-slate-400 disabled:no-underline inline-flex items-center gap-1 cursor-pointer"
            >
              {resending ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>جاري الإرسال...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3" />
                  <span>إعادة إرسال الرمز</span>
                </>
              )}
            </button>
          </div>

          <div>
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-700 transition"
            >
              <ArrowRight className="w-3 h-3" />
              <span>تغيير البريد الإلكتروني</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-700" />
          <span className="text-xs font-semibold">جاري التحميل...</span>
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
