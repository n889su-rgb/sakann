"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, ArrowRight, Loader2, CheckCircle2, KeyRound, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("يرجى إدخال بريد إلكتروني صحيح");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل إرسال رمز التحقق");
      }

      setSuccessMsg(data.message || "إذا كان البريد مسجلاً، فستصلك رسالة تحتوي على رمز التحقق خلال لحظات.");

      // Save email for the verification step and redirect after a brief moment
      if (typeof window !== "undefined") {
        sessionStorage.setItem("sakan_reset_email", cleanEmail);
      }

      setTimeout(() => {
        router.push(`/verify-otp?email=${encodeURIComponent(cleanEmail)}`);
      }, 1200);
    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع أثناء إرسال الرمز");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pt-6 pb-16 px-4">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
        
        {/* Header Icon & Title */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-brand-50 text-brand-800 flex items-center justify-center mx-auto shadow-inner border border-brand-100">
            <KeyRound className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">استعادة كلمة المرور</h1>
            <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto mt-1 leading-relaxed">
              أدخل بريدك الإلكتروني المسجل وسنرسل لك رمز تحقق OTP مكوّناً من 6 أرقام لإعادة تعيين كلمة المرور.
            </p>
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
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col gap-2.5 text-emerald-800 text-xs font-bold animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
            <Link
              href={`/verify-otp?email=${encodeURIComponent(email.trim().toLowerCase())}`}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-center rounded-xl font-bold shadow-sm transition flex items-center justify-center gap-1.5"
            >
              <span>الانتقال لإدخال رمز التحقق (OTP)</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              البريد الإلكتروني المسجل
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-50 border border-slate-200 py-3 pr-10 pl-3 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-brand-700 focus:bg-white transition dir-ltr text-right"
                disabled={loading}
              />
              <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brand-800 hover:bg-brand-700 active:scale-98 text-white rounded-2xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري إرسال الرمز...</span>
              </>
            ) : (
              <span>إرسال رمز التحقق</span>
            )}
          </button>
        </form>

        <div className="pt-2 text-center border-t border-slate-100">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-800 transition"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>تذكرت كلمة المرور؟ تسجيل الدخول</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
