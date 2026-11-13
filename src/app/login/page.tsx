"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Phone, Lock, Loader2, AlertCircle, LogIn, ShieldCheck, Eye, EyeOff, MessageSquare, Mail, Sparkles, KeyRound, CheckCircle2 } from "lucide-react";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export default function LoginPage() {
  const router = useRouter();
  const [loginMode, setLoginMode] = useState<"PHONE" | "EMAIL">("PHONE");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [identifiedUser, setIdentifiedUser] = useState<string | null>(null);
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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
    setPhone(digits);
    if (requiresPassword) {
      setRequiresPassword(false);
      setIdentifiedUser(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let identifier = "";
    if (loginMode === "PHONE") {
      const cleanPhone = phone.trim().replace(/\D/g, "");
      if (cleanPhone.length !== 9) {
        setError("يرجى إدخال رقم الهاتف المكون من 9 أرقام بعد رمز +249");
        return;
      }
      identifier = `249${cleanPhone}`;
    } else {
      if (!email.trim() || !email.includes("@")) {
        setError("يرجى إدخال بريد إلكتروني صحيح");
        return;
      }
      identifier = email.trim();
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          password: password ? password.trim() : null,
        }),
      });

      const data = await res.json();

      // If account requires password (Landlord or Admin) and password was not yet provided
      if (data.requiresPassword && !data.success) {
        setRequiresPassword(true);
        if (data.userName) setIdentifiedUser(data.userName);
        setError(data.error || "هذا الحساب محمي بكلمة مرور، يرجى كتابة كلمة المرور");
        setLoading(false);
        return;
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل تسجيل الدخول");
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

  const handleWhatsAppHelp = () => {
    const rawNumber = loginMode === "PHONE" ? `+249${phone}` : email;
    const msg = encodeURIComponent(
      `السلام عليكم إدارة سكن، أحتاج مساعدة في استعادة كلمة المرور لحسابي: ${rawNumber}`
    );
    window.open(`https://wa.me/249111900328?text=${msg}`, "_blank");
  };

  return (
    <div className="max-w-md mx-auto pt-6 pb-12">
      {/* Top Brand Header */}
      <div className="flex items-center justify-center pb-4 border-b border-slate-200 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/90 p-1 flex items-center justify-center shadow-sm">
            <Image src="/logo.png" alt="سكن SAKAN" width={32} height={32} className="w-full h-full object-contain" priority />
          </div>
          <span className="text-base font-extrabold text-brand-900 tracking-tight">سَكَن SAKAN</span>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
        {/* Requirement Notice */}
        <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center gap-2.5 text-emerald-900 text-xs font-semibold leading-relaxed">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>سجّل دخولك لمتابعة وتصفح الشقق المفروشة والتواصل المباشر مع الملاك.</span>
        </div>

        <div className="text-center space-y-1">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200/90 p-2 flex items-center justify-center mx-auto mb-3 shadow-md">
            <Image src="/logo.png" alt="سكن SAKAN" width={52} height={52} className="w-full h-full object-contain" priority />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">تسجيل الدخول إلى سَكَن</h1>
          <p className="text-xs text-slate-500 font-medium">
            دخول فوري للمستأجرين وتأمين لإعلانات الملاك
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
          <span className="bg-white px-3 text-[11px] font-bold text-slate-400 absolute">أو برقم الهاتف</span>
        </div>

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

        {infoMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{infoMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {loginMode === "PHONE" ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  رقم الهاتف للتواصل والواتساب
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode("EMAIL");
                    setRequiresPassword(true);
                  }}
                  className="text-[10px] text-brand-800 hover:underline font-bold"
                >
                  الدخول بالبريد الإلكتروني
                </button>
              </div>

              <div
                dir="ltr"
                className="flex items-center dir-ltr bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-700 focus-within:bg-white focus-within:border-brand-700 transition"
              >
                {/* Fixed Country Code on Left */}
                <div className="flex items-center gap-1.5 px-3.5 py-3 bg-slate-100 border-r border-slate-200 text-slate-800 font-extrabold text-sm select-none shrink-0">
                  <span className="text-base leading-none">🇸🇩</span>
                  <span className="tracking-wider text-slate-900 font-mono">+249</span>
                </div>

                {/* 9 Digits Input */}
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  value={phone}
                  onChange={handlePhoneChange}
                  maxLength={9}
                  className="w-full bg-transparent py-3 px-3.5 text-sm font-bold tracking-widest text-slate-900 focus:outline-none"
                />

                <div className="pr-3.5 pl-3 text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                <span>أدخل 9 أرقام بعد رمز +249</span>
                <span className={`font-mono font-bold ${phone.length === 9 ? "text-emerald-600" : "text-slate-400"}`}>
                  {phone.length}/9
                </span>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  البريد الإلكتروني
                </label>
                <button
                  type="button"
                  onClick={() => setLoginMode("PHONE")}
                  className="text-[10px] text-brand-800 hover:underline font-bold"
                >
                  الرجوع للدخول برقم الهاتف
                </button>
              </div>

              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-50 border border-slate-200 py-3 pr-10 pl-3 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-brand-700 focus:bg-white transition dir-ltr text-right"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          {/* Password field: Appears if required by Landlord/Admin or toggle */}
          {(requiresPassword || loginMode === "EMAIL") && (
            <div className="animate-in fade-in duration-200 space-y-1">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">كلمة المرور</label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-bold text-brand-800 hover:underline inline-flex items-center gap-1"
                >
                  <KeyRound className="w-3 h-3" />
                  نسيت كلمة المرور؟
                </Link>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 py-3 pr-10 pl-10 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-brand-700 focus:bg-white transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {identifiedUser && (
                <span className="text-[10px] text-amber-700 font-semibold block pt-1">
                  مرحباً {identifiedUser}، حسابك مسجل كمعلن ومحمي بكلمة مرور.
                </span>
              )}
            </div>
          )}

          {/* Quick toggle if user knows they are a landlord with password */}
          {!requiresPassword && loginMode === "PHONE" && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">حسابات المستأجرين تدخل فوراً بدون كلمة سر</span>
              <button
                type="button"
                onClick={() => setRequiresPassword(true)}
                className="text-[11px] text-brand-800 font-bold hover:underline"
              >
                أنا معلن / لدي كلمة مرور
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brand-800 hover:bg-brand-700 active:scale-98 text-white rounded-2xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري تسجيل الدخول...
              </>
            ) : requiresPassword ? (
              "تأكيد تسجيل الدخول"
            ) : (
              "تسجيل الدخول والتصفح الفوري"
            )}
          </button>
        </form>

        <div className="text-center pt-3 border-t border-slate-100 space-y-2">
          <p className="text-xs text-slate-500 font-medium">
            ليس لديك حساب بعد؟{" "}
            <Link
              href={redirectUrl !== "/" ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : "/register"}
              className="font-bold text-brand-800 hover:underline"
            >
              أنشئ حسابك الجديد الآن مجاناً
            </Link>
          </p>
          <div className="pt-1">
            <Link
              href="/forgot-password"
              className="text-xs text-slate-500 hover:text-brand-800 font-semibold inline-flex items-center gap-1 transition"
            >
              <KeyRound className="w-3 h-3 text-slate-400" />
              <span>هل نسيت كلمة المرور؟ استعادة الحساب بالبريد</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
