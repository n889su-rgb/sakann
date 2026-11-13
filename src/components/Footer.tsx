"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, ShieldCheck, PhoneCall, Sparkles } from "lucide-react";

export function Footer() {
  const pathname = usePathname();

  // Hide customer footer on Admin pages
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  // Developer signature visibility toggle (set to true when requested)
  const SHOW_DEVELOPER_CREDIT = false;

  return (
    <footer className="mt-auto border-t border-slate-200/90 bg-white/70 backdrop-blur-sm text-slate-600">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-100">
          {/* Brand info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/90 p-0.5 flex items-center justify-center shadow-sm">
                <Image src="/logo.png" alt="سكن SAKAN" width={28} height={28} className="w-full h-full object-contain" />
              </div>
              <span className="text-base font-extrabold text-brand-900 tracking-tight">
                سَكَن <span className="text-xs font-semibold text-brand-700 uppercase tracking-widest">SAKAN</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              المنصة المتخصصة في إيجار الشقق المفروشة في السودان؛ تواصل مباشر مع الملاك ونشر فوري وموثوق.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800">روابط سريعة</h4>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
              <Link href="/" className="hover:text-brand-800 transition">
                تصفح الشقق
              </Link>
              <Link href="/properties/new" className="hover:text-brand-800 transition">
                أضف شقتك
              </Link>
              <Link href="/login" className="hover:text-brand-800 transition">
                تسجيل الدخول
              </Link>
              <Link href="/register" className="hover:text-brand-800 transition">
                إنشاء حساب
              </Link>
            </div>
          </div>

          {/* Guarantee Badges */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800">مميزات المنصة</h4>
            <div className="space-y-1 text-[11px] text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-700 shrink-0" />
                <span>نشر فوري ومباشر للشقق</span>
              </div>
              <div className="flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-brand-700 shrink-0" />
                <span>تواصل هاتفي ومراسلة واتساب مباشرة</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-700 shrink-0" />
                <span>عمولة موحدة وواضحة 5%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Credits & Developer Signature */}
        <div className={`pt-5 flex flex-col sm:flex-row items-center ${SHOW_DEVELOPER_CREDIT ? "justify-between" : "justify-center"} gap-3 text-xs text-slate-400 font-medium`}>
          <p dir="rtl" className="dir-rtl text-center">
            جميع الحقوق محفوظة لمنصة سَكَن العقارية © {new Date().getFullYear()}
          </p>

          {/* MS TECH Developer Credit (Hidden until user requests to show it) */}
          {SHOW_DEVELOPER_CREDIT && (
            <div className="flex items-center gap-1.5 text-[11px]">
              <span>تطوير وتشغيل تقني بواسطة</span>
              <span className="font-extrabold tracking-wider text-brand-900 bg-brand-50 border border-brand-200/70 px-2.5 py-0.5 rounded-lg text-xs font-mono shadow-2xs hover:bg-brand-100 transition cursor-default">
                MS TECH
              </span>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
