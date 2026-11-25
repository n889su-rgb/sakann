"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { User, Lock, Loader2, AlertCircle, Eye, EyeOff, CheckCircle2, KeyRound } from "lucide-react";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState("/");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");
      if (redirect) setRedirectUrl(redirect);
      const err = params.get("error");
      if (err) setError(err);
      const msg = params.get("message");
      if (msg) setInfoMessage(msg);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setError("يرجى إدخال البريد الإلكتروني أو رقم الهاتف");
      return;
    }

    if (!password) {
      setError("يرجى إدخال كلمة المرور");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: cleanIdentifier,
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل تسجيل الدخول، يرجى التأكد من البيانات");
      }

      if (data.user?.role === "ADMIN" || data.user?.role === "SUPER_ADMIN") {
        router.push("/admin");
      } else {
        router.push(redirectUrl);
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "بيانات الدخول غير صحيحة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pt-6 pb-12">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200/90 p-2 flex items-center justify-center mx-auto mb-3 shadow-md">
            <Image src="/logo.png" alt="بَيْت BAYT" width={52} height={52} className="w-full h-full object-contain" priority />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">تسجيل الدخول إلى بَيْت</h1>
          <p className="text-xs text-slate-500 font-medium">
            تصفح الشقق وتواصل المباشر مع الملاك
          </p>
        </div>

        {/* 1-Click Google Sign-In Button */}
        <GoogleSignInButton
          redirectUrl={redirectUrl}
          onError={(err) => setError(err)}
        />

        {/* Separator */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full"></div>
          <span className="bg-white px-3 text-[11px] font-bold text-slate-400 absolute">
            أو عبر البريد أو رقم الهاتف
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-red-800 text-xs font-bold leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{error}</span>
              {error.includes("غير مسجل") && (
                <div className="mt-2">
                  <Link
                    href={`/register?redirect=${encodeURIComponent(redirectUrl)}`}
                    className="inline-flex items-center gap-1 bg-brand-800 text-white px-3 py-1.5 rounded-xl text-[11px] font-bold hover:bg-brand-700 transition"
                  >
                    أنشئ حسابك الجديد الآن مجاناً
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info / Success Alert */}
        {infoMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Standard Clean Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Field 1: Email or Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              البريد الإلكتروني أو رقم الهاتف
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="0912345678 أو name@example.com"
                className="w-full bg-slate-50 border border-slate-200 py-3 pr-10 pl-3 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-brand-700 focus:bg-white transition dir-ltr text-right placeholder:text-slate-400"
                autoFocus
              />
              <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Field 2: Password + Forgot Password Link */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">كلمة المرور</label>
              <Link
                href="/forgot-password"
                className="text-[11px] font-bold text-brand-800 hover:underline inline-flex items-center gap-1"
              >
                <KeyRound className="w-3 h-3" />
                <span>نسيت كلمة السر؟</span>
              </Link>
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 py-3 pr-10 pl-10 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-brand-700 focus:bg-white transition"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brand-800 hover:bg-brand-700 active:scale-98 text-white rounded-2xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري تسجيل الدخول...</span>
              </>
            ) : (
              <span>تسجيل الدخول</span>
            )}
          </button>
        </form>

        {/* Footer: Register Link */}
        <div className="text-center pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500 font-medium">
            ليس لديك حساب بعد؟{" "}
            <Link
              href={redirectUrl !== "/" ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : "/register"}
              className="font-bold text-brand-800 hover:underline"
            >
              أنشئ حسابك الجديد الآن مجاناً
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
