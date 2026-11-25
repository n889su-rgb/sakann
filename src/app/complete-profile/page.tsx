"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Phone, Loader2, AlertCircle, ShieldCheck } from "lucide-react";

export default function CompleteProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentUserData();
  }, []);

  const fetchCurrentUserData = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.success && data.user) {
        setName(data.user.name || "");
        setEmail(data.user.email || "");
        if (data.user.phone) {
          let p = data.user.phone.replace(/\D/g, "");
          if (p.startsWith("249")) p = p.slice(3);
          else if (p.startsWith("0")) p = p.slice(1);
          setPhone(p.slice(0, 9));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInitial(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only accept numeric digits, maximum 9 digits
    const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
    setPhone(digits);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length !== 9) {
      setError("يرجى إدخال رقم الهاتف المكون من 9 أرقام بعد رمز +249");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: `249${cleanPhone}`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل حفظ البيانات");
      }

      // Redirect immediately to home page to start browsing
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء حفظ البيانات");
      setLoading(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-700" />
        <span className="text-xs font-semibold">جاري تحميل بيانات الحساب...</span>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pt-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-center pb-4 border-b border-slate-200 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-800 flex items-center justify-center text-white font-extrabold text-base shadow-sm">
            ب
          </div>
          <span className="text-base font-extrabold text-brand-900 tracking-tight">بَيْت BAYT</span>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
        {/* Requirement Notice */}
        <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-start gap-2.5 text-emerald-950 text-xs font-semibold leading-relaxed">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-emerald-900 mb-0.5">خطوة أخيرة لإكمال حسابك:</span>
            <span>
              لتتمكن من تصفح الشقق المفروشة والتواصل المباشر مع الملاك عبر الاتصال والواتساب، يرجى تأكيد اسمك وإضافة رقم هاتفك.
            </span>
          </div>
        </div>

        <div className="text-center space-y-1">
          <div className="w-14 h-14 rounded-2xl bg-brand-800 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <User className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">إكمال بيانات الحساب</h1>
          {email && (
            <p className="text-xs text-slate-500 font-mono dir-ltr">
              {email}
            </p>
          )}
        </div>

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
            <span className="text-[10px] text-slate-400 mt-1 block">يمكنك تعديل اسمك أو تركه كما هو</span>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brand-800 hover:bg-brand-700 active:scale-98 text-white rounded-2xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2 mt-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري الحفظ وبدء التصفح...
              </>
            ) : (
              "حفظ البيانات وبدء التصفح"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
