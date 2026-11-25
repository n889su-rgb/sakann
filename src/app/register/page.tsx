"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { User, Phone, Lock, Loader2, AlertCircle, ShieldCheck, Eye, EyeOff, Home, Sparkles, Mail } from "lucide-react";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLandlord, setIsLandlord] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState("/");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect");
      if (redirect) setRedirectUrl(redirect);
      const err = params.get("error");
      if (err) setError(err);
    }
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let digits = e.target.value.replace(/\D/g, "");
    if (digits.startsWith("249")) digits = digits.slice(3);
    while (digits.startsWith("0")) digits = digits.slice(1);
    setPhone(digits.slice(0, 9));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length !== 9) {
      setError("يرجى إدخال رقم الهاتف المكون من 9 أرقام بعد رمز +249");
      return;
    }

    if (isLandlord) {
      if (!password || password.length < 4) {
        setError("يرجى إدخال كلمة مرور أو رمز PIN مكون من 4 خانات على الأقل لحماية إعلاناتك");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: `249${cleanPhone}`,
          email: isLandlord && email.trim() ? email.trim().toLowerCase() : null,
          password: isLandlord ? password : null,
          isLandlord,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل إنشاء الحساب");
      }

      router.push(redirectUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pt-6 pb-12">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
        {/* Requirement Notice */}
        <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center gap-2.5 text-emerald-900 text-xs font-semibold leading-relaxed">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>أنشئ حسابك مجاناً للتواصل المباشر مع ملاك الشقق المفروشة.</span>
        </div>

        <div className="text-center space-y-1">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200/90 p-2 flex items-center justify-center mx-auto mb-3 shadow-md">
            <Image src="/logo.png" alt="بَيْت BAYT" width={52} height={52} className="w-full h-full object-contain" priority />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">إنشاء حساب جديد</h1>
          <p className="text-xs text-slate-500 font-medium">
            سجّل بياناتك الآن للبدء في تصفح الشقق المفروشة والتواصل الفوري
          </p>
        </div>

        {/* 1-Click Google Sign-In Button */}
        <GoogleSignInButton
          label="التسجيل السريع باستخدام Google"
          redirectUrl={redirectUrl}
          onError={(err) => setError(err)}
        />

        {/* Separator */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full"></div>
          <span className="bg-white px-3 text-[11px] font-bold text-slate-400 absolute">أو برقم الهاتف</span>
        </div>

        {/* Account Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setIsLandlord(false)}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              !isLandlord
                ? "bg-white text-brand-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <User className="w-4 h-4" />
            <span>مستأجر (باحث عن سكن)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsLandlord(true)}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              isLandlord
                ? "bg-white text-brand-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Home className="w-4 h-4" />
            <span>مالك / معلن عقار</span>
          </button>
        </div>

        {/* Role Helper Banner */}
        {!isLandlord ? (
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl flex items-center gap-2 text-[11px] text-emerald-900 font-medium">
            <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>تسجيل فوري بدون كلمة سر للتواصل المباشر مع ملاك الشقق.</span>
          </div>
        ) : (
          <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-2xl flex items-center gap-2 text-[11px] text-amber-900 font-medium">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>لحسابات الملاك: يتم وضع كلمة مرور بسيطة لتأمين إعلاناتك وشققك.</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-red-800 text-xs font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">الاسم بالكامل</label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 py-3 pr-10 pl-3 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-brand-700 focus:bg-white transition"
              />
              <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              رقم الهاتف للتواصل والواتساب
            </label>
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

          {/* Password Field: ONLY for Landlords (Single field with Show/Hide toggle) */}
          {isLandlord && (
            <div className="animate-in fade-in duration-200">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                كلمة المرور لحماية إعلاناتك
              </label>
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
              <span className="text-[10px] text-slate-400 mt-1 block">
                حقل واحد سهل (4 خانات أو أحرف على الأقل) لحماية شققك من التعديل
              </span>
            </div>
          )}

          {/* Email Field: ONLY for Landlords (Recommended for Password Recovery OTP) */}
          {isLandlord && (
            <div className="animate-in fade-in duration-200">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>البريد الإلكتروني (موصى به للمؤجر)</span>
                <span className="text-[10px] text-emerald-700 font-semibold">لاستعادة كلمة المرور عبر الرمز</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-50 border border-slate-200 py-3 pr-10 pl-3 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-brand-700 focus:bg-white transition dir-ltr text-right"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
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
                جاري المعالجة...
              </>
            ) : isLandlord ? (
              "إنشاء حساب معلن والبدء"
            ) : (
              "متابعة وبدء التصفح الفوري"
            )}
          </button>
        </form>

        <div className="text-center pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500 font-medium">
            لديك حساب بالفعل؟{" "}
            <Link
              href={redirectUrl !== "/" ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : "/login"}
              className="font-bold text-brand-800 hover:underline"
            >
              تسجيل الدخول هنا
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
