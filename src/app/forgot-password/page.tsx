"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  ArrowRight,
  Loader2,
  CheckCircle2,
  KeyRound,
  AlertCircle,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Clock,
  RefreshCw,
} from "lucide-react";

type ResetStep = "EMAIL" | "OTP" | "NEW_PASSWORD";

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Wizard Step State
  const [step, setStep] = useState<ResetStep>("EMAIL");

  // Step 1: Email
  const [email, setEmail] = useState("");

  // Step 2: OTP
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [resending, setResending] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 3: Password
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Common UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Countdown timer for Step 2 (OTP)
  useEffect(() => {
    if (step !== "OTP" || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ==========================================
  // STEP 1: Submit Email & Check Registration
  // ==========================================
  const handleEmailSubmit = async (e: React.FormEvent) => {
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
        throw new Error(data.error || "هذا البريد غير مسجل لدينا مسبقاً");
      }

      // Immediately transition directly to Step 2 (OTP input boxes)
      setStep("OTP");
      setTimeLeft(300);
      setOtp(["", "", "", "", "", ""]);
      setSuccessMsg("تم إرسال رمز التحقق إلى بريدك الإلكتروني!");

      // Focus first OTP box automatically
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء فحص البريد الإلكتروني");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // STEP 2: Handle 6-Digit OTP Inputs
  // ==========================================
  const handleOtpDigitChange = (index: number, value: string) => {
    // Only accept numeric digits
    const cleaned = value.replace(/\D/g, "");

    // Support pasting the entire 6-digit code at once
    if (cleaned.length > 1) {
      const pastedDigits = cleaned.slice(0, 6).split("");
      const newOtp = [...otp];
      pastedDigits.forEach((digit, i) => {
        if (i < 6) newOtp[i] = digit;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(5, pastedDigits.length);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = cleaned;
    setOtp(newOtp);

    // Auto-advance to next input box if a digit was typed
    if (cleaned && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const fullOtp = otp.join("").trim();
    if (fullOtp.length !== 6) {
      setError("يرجى إدخال رمز التحقق كاملاً المكون من 6 أرقام");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: fullOtp,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "رمز التحقق غير صحيح");
      }

      // Immediately transition directly to Step 3 (New Password)
      setResetToken(data.resetToken);
      setStep("NEW_PASSWORD");
      setSuccessMsg(null);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء التحقق من الرمز");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resending || !email) return;
    setError(null);
    setSuccessMsg(null);
    setResending(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل إعادة إرسال الرمز");
      }

      setTimeLeft(300);
      setOtp(["", "", "", "", "", ""]);
      setSuccessMsg("تم إرسال رمز تحقق جديد إلى بريدك الإلكتروني بنجاح!");
      otpInputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء إعادة إرسال الرمز");
    } finally {
      setResending(false);
    }
  };

  // ==========================================
  // STEP 3: Submit New Password
  // ==========================================
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("كلمة المرور يجب ألا تقل عن 6 أحرف");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resetToken,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل حفظ كلمة المرور الجديدة");
      }

      setSuccessMsg("تم تغيير كلمة المرور بنجاح! جاري تحويلك لتسجيل الدخول...");

      setTimeout(() => {
        router.push(
          "/login?message=" + encodeURIComponent("تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.")
        );
      }, 1200);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء حفظ كلمة المرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pt-6 pb-16 px-4">
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 pb-1">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step === "EMAIL" ? "w-8 bg-brand-800" : "w-4 bg-emerald-600"
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step === "OTP" ? "w-8 bg-brand-800" : step === "NEW_PASSWORD" ? "w-4 bg-emerald-600" : "w-4 bg-slate-200"
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step === "NEW_PASSWORD" ? "w-8 bg-brand-800" : "w-4 bg-slate-200"
            }`}
          />
        </div>

        {/* ============================================================== */}
        {/* STEP 1: ENTER & VERIFY EMAIL                                   */}
        {/* ============================================================== */}
        {step === "EMAIL" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-brand-50 text-brand-800 flex items-center justify-center mx-auto shadow-inner border border-brand-100">
                <KeyRound className="w-8 h-8" />
              </div>
              <h1 className="text-xl font-extrabold text-slate-900">استعادة كلمة المرور</h1>
              <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">
                أدخل بريدك الإلكتروني المسجل وسنتحقق من وجوده ونرسل لك رمز تحقق OTP مكوّناً من 6 أرقام.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-red-800 text-xs font-bold animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  البريد الإلكتروني المسجل في سكن
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
                    autoFocus
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
                    <span>جاري التحقق وإرسال الرمز...</span>
                  </>
                ) : (
                  <span>إرسال رمز التحقق</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 2: 6-DIGIT OTP INPUT BOXES                                */}
        {/* ============================================================== */}
        {step === "OTP" && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto shadow-inner border border-emerald-100">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h1 className="text-xl font-extrabold text-slate-900">أدخل رمز التحقق (OTP)</h1>
              <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">
                تم إرسال رمز مكون من 6 أرقام إلى:
              </p>
              <span className="inline-block mt-0.5 text-xs font-bold text-brand-900 bg-slate-100 px-3 py-1 rounded-full dir-ltr">
                {email}
              </span>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-red-800 text-xs font-bold animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleOtpSubmit} className="space-y-5">
              {/* 6 Individual Code Boxes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-3 text-center">
                  أدخل الرمز المكون من 6 أرقام
                </label>
                <div className="flex items-center justify-center gap-2 dir-ltr">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpInputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      disabled={loading}
                      className="w-12 h-14 text-center text-xl font-black rounded-2xl border-2 border-slate-200 bg-slate-50 text-brand-950 focus:border-brand-700 focus:bg-white focus:ring-2 focus:ring-brand-700/20 transition outline-none font-mono"
                    />
                  ))}
                </div>
              </div>

              {/* Timer & Expiration Display */}
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 pt-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>صلاحية الرمز:</span>
                <span className={`font-mono font-bold ${timeLeft < 60 ? "text-red-600 animate-pulse" : "text-brand-800"}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>

              <button
                type="submit"
                disabled={loading || otp.join("").length !== 6}
                className="w-full py-3.5 bg-brand-800 hover:bg-brand-700 active:scale-98 text-white rounded-2xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري التحقق من الرمز...</span>
                  </>
                ) : (
                  <span>تأكيد الرمز والمتابعة</span>
                )}
              </button>

              {/* Resend and Back actions */}
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
                  <button
                    type="button"
                    onClick={() => {
                      setStep("EMAIL");
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                  >
                    <ArrowRight className="w-3 h-3" />
                    <span>تغيير البريد الإلكتروني</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 3: NEW PASSWORD & CONFIRMATION                            */}
        {/* ============================================================== */}
        {step === "NEW_PASSWORD" && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-3xl bg-brand-50 text-brand-800 flex items-center justify-center mx-auto shadow-inner border border-brand-100">
                <Lock className="w-8 h-8" />
              </div>
              <h1 className="text-xl font-extrabold text-slate-900">تعيين كلمة المرور الجديدة</h1>
              <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">
                تم التحقق من هويتك بنجاح! أدخل كلمة المرور الجديدة لحسابك.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-red-800 text-xs font-bold animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  كلمة المرور الجديدة
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 py-3 pr-10 pl-10 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-brand-700 focus:bg-white transition"
                    disabled={loading}
                    autoFocus
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 font-medium block mt-1">
                  يجب ألا تقل عن 6 أحرف
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  تأكيد كلمة المرور الجديدة
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 py-3 pr-10 pl-10 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-brand-700 focus:bg-white transition"
                    disabled={loading}
                  />
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || newPassword.length < 6}
                className="w-full py-3.5 bg-brand-800 hover:bg-brand-700 active:scale-98 text-white rounded-2xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري حفظ كلمة المرور...</span>
                  </>
                ) : (
                  <span>حفظ كلمة المرور والدخول</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Back to Login */}
        <div className="pt-2 text-center border-t border-slate-100">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-800 transition"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>الرجوع إلى تسجيل الدخول</span>
          </Link>
        </div>

      </div>
    </div>
  );
}
