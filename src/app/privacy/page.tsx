import Link from "next/link";
import { Shield, ArrowRight, Lock, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "سياسة الخصوصية | منصة بَيْت",
  description: "سياسة الخصوصية وحماية بيانات المستخدمين والمؤجرين في منصة بَيْت.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-800 transition mb-3"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة إلى الرئيسية</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">سياسة الخصوصية وسرية البيانات</h1>
            <p className="text-xs text-slate-500 mt-0.5">التزام منصة بَيْت (BAYT) بحماية خصوصيتك</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-700" />
            ١. البيانات التي نجمعها
          </h2>
          <p className="text-slate-600">
            نجمع فقط البيانات الأساسية الضرورية لتقديم خدمة وساطة تأجير الشقق المفروشة بكفاءة وأمان:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-600 mr-2">
            <li>الاسم ورقم الهاتف للتواصل المباشر.</li>
            <li>البريد الإلكتروني (اختياري للمؤجر لاسترجاع الحساب عبر الرمز).</li>
            <li>تفاصيل العقار والصور والمرافق المتاحة وموقع الشقة.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-700" />
            ٢. حماية بيانات التواصل (Guest Gating)
          </h2>
          <p className="text-slate-600">
            حرصاً على حماية خصوصية الملاك والمعلنين ومنع الاتصالات المزعجة أو العشوائية، لا تظهر أرقام الهواتف وروابط الواتساب لزوار المنصة غير المسجلين. يجب تسجيل الدخول برقم هاتف موثق للتمكن من التواصل المباشر مع المالك.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-700" />
            ٣. أمان الجلسات وكلمات المرور
          </h2>
          <p className="text-slate-600">
            يتم تشفير كلمات المرور باستخدام خوارزميات التشفير المتقدمة (Bcrypt)، ولا يتم حفظ أي كلمات مرور بنص صريح. كما تعتمد جلسات الدخول على رموز مشفرة بتقنية JWT المحمية بملفات تعريف ارتباط آمنة (HttpOnly Cookies).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-700" />
            ٤. مشاركة البيانات مع أطراف ثالثة
          </h2>
          <p className="text-slate-600">
            نحن <strong>لا نقوم إطلاقاً</strong> ببيع أو تأجير أو مشاركة بيانات مستخدمينا مع أي جهات خارجية أو معلنين تجاريين. بياناتك تستخدم فقط ضمن نطاق عمل منصة بَيْت لتيسير المعاينة والتأجير.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-700" />
            ٥. حقوقك والاستفسارات
          </h2>
          <p className="text-slate-600">
            يحق لك في أي وقت تعديل بياناتك الشخصية من خلال صفحة "حسابي"، أو طلب حذف حسابك وإعلاناتك بالتواصل مع إدارة المنصة مباشرة عبر واتساب:{" "}
            <a
              href="https://wa.me/249111900328"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 font-bold hover:underline dir-ltr inline-block"
            >
              +249 111 900 328
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
