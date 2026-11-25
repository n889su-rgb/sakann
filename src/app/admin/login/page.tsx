"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Shield, Lock, User, Eye, EyeOff, Loader2, AlertCircle, ArrowRight } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if already logged in as admin
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user && (data.user.role === "ADMIN" || data.user.role === "SUPER_ADMIN")) {
          router.replace("/admin");
        }
      })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "بيانات الدخول غير صحيحة");
      }

      if (data.user?.role !== "ADMIN" && data.user?.role !== "SUPER_ADMIN") {
        throw new Error("عذراً، هذا الحساب ليس لديه صلاحيات للوصول إلى لوحة الإدارة");
      }

      // Success: redirect directly into the Admin dashboard
      window.location.href = "/admin";
    } catch (err: any) {
      setError(err.message || "فشل تسجيل الدخول كمسؤول");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="max-w-md w-full bg-slate-900 text-white p-7 sm:p-9 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-white p-2 border border-slate-700/80 flex items-center justify-center mx-auto shadow-lg">
            <Image src="/logo.png" alt="بَيْت BAYT" width={52} height={52} className="w-full h-full object-contain" priority />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">
            بوابة إدارة منصة بَيْت
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            BAYT Executive Control Portal • تسجيل دخول مخصص
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-950/70 border border-red-800/80 rounded-2xl flex items-center gap-2.5 text-red-200 text-xs font-bold leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Admin Identifier */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              اسم المستخدم أو البريد الإلكتروني
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 py-3 pr-10 pl-3 rounded-2xl text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
              <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Admin Password */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 py-3 pr-10 pl-10 rounded-2xl text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-2xl text-sm font-bold shadow-lg transition flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
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

        {/* Back Link */}
        <div className="text-center pt-2 border-t border-slate-800/80">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 font-medium transition"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            العودة إلى الصفحة الرئيسية لمنصة بَيْت
          </Link>
        </div>
      </div>
    </div>
  );
}
