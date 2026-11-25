import Link from "next/link";
import { ShieldCheck, FileText, ArrowRight, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "شروط الاستخدام | منصة بَيْت",
  description: "الشروط والأحكام المنظمة لاستخدام منصة بَيْت لإيجار الشقق المفروشة في السودان وضوابط العمولة والتعامل.",
};

export default function TermsPage() {
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
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-800 flex items-center justify-center border border-brand-100">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">شروط وأحكام الاستخدام</h1>
            <p className="text-xs text-slate-500 mt-0.5">منصة بَيْت (BAYT) للشقق المفروشة في السودان</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-700" />
            ١. طبيعة عمل المنصة
          </h2>
          <p className="text-slate-600">
            منصة <strong>بَيْت (BAYT)</strong> هي وسيط رقمي تقني يهدف إلى تسهيل ربط الباحثين عن شقق مفروشة بالملاك والمعلنين المعتمدين في مدن السودان المختلفة بشكل مباشر، مع إتاحة وسائط تواصل فورية عبر الهاتف والواتساب.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-700" />
            ٢. التزامات المؤجرين وملاك العقارات
          </h2>
          <ul className="list-disc list-inside space-y-1.5 text-slate-600 mr-2">
            <li>التعهد بصحة ودقة كافة البيانات والصور المعروضة للشقة ومطابقتها للواقع.</li>
            <li>التعهد بامتلاك العقار أو وجود تفويض رسمي وقانوني يتيح الإعلان عنه وتأجيره.</li>
            <li>تحديث حالة الإعلان إلى "تم التأجير" فور إتمام استئجار الشقة لمنع إزعاج المستأجرين.</li>
            <li>الالتزام بسداد عمولة المنصة المحددة بنسبة <strong>5%</strong> عند إتمام التعاقد عبر التطبيق.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-700" />
            ٣. سياسة العمولة والدفع
          </h2>
          <div className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl space-y-2">
            <p className="font-bold text-emerald-950">عمولة المنصة موحدة وواضحة (5%):</p>
            <p className="text-xs text-emerald-900 leading-relaxed">
              تستحق المنصة عمولتها بنسبة 5% من قيمة الإيجار للشهر الأول (أو إجمالي قيمة الإيجار اليومي) عند إتمام المعاينة والاتفاق. يتم سداد العمولة عبر تحويل تطبيق <strong>بنكك (بنك الخرطوم)</strong> إلى الحساب المعتمد:
            </p>
            <div className="p-2.5 bg-white border border-emerald-300 rounded-xl font-mono text-xs text-slate-800">
              رقم الحساب: <strong className="text-brand-900 text-sm">2345678</strong> • الاسم: <strong>منصة بيت العقارية</strong>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-700" />
            ٤. التزامات المستأجرين
          </h2>
          <ul className="list-disc list-inside space-y-1.5 text-slate-600 mr-2">
            <li>الجدية التامة عند الاتصال أو مراسلة الملاك عبر الهاتف أو الواتساب.</li>
            <li>معاينة الشقة والتأكد من توافر كافة المرافق المعلن عنها قبل دفع أي مبالغ مالية أو توقيع عقود.</li>
            <li>الإبلاغ الفوري عبر زر "الإبلاغ عن الإعلان" في حال وجود أي بيانات غير صحيحة أو أرقام لا تستجيب.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-700" />
            ٥. التواصل والدعم الفني
          </h2>
          <p className="text-slate-600">
            لأي استفسارات أو بلاغات حول الإعلانات أو عمليات الدفع، يمكنكم التواصل مباشرة مع فريق الدعم الفني عبر واتساب على الرقم:{" "}
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
