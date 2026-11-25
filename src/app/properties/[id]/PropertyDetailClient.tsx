"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Bed,
  Bath,
  Phone,
  MessageSquare,
  AlertTriangle,
  ShieldCheck,
  Lock,
  LogIn,
  Heart,
  Share2,
  Check,
  Edit3,
  Copy,
  ExternalLink,
  X,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { DirectContactModal } from "@/components/DirectContactModal";
import { useFavorites } from "@/lib/favorites";

export default function PropertyDetailClient({
  property,
  commissionEnabled,
  tenantCommissionPercent,
  isGuest = false,
  isOwner = false,
}: {
  property: any;
  commissionEnabled: boolean;
  tenantCommissionPercent: number;
  isGuest?: boolean;
  isOwner?: boolean;
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactType, setContactType] = useState<"PHONE_CALL" | "WHATSAPP">("PHONE_CALL");
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("ALREADY_RENTED");
  const [reportSent, setReportSent] = useState(false);

  // Share modal state
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Favorites state
  const { isFav, toggle, mounted } = useFavorites();
  const isFavorite = mounted && !isGuest && isFav(property.id);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleFavoriteToggle = () => {
    if (isGuest) {
      setShowLoginModal(true);
      return;
    }
    toggle(property.id);
  };

  const images =
    property.images && property.images.length > 0
      ? property.images
      : [{ url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80" }];

  const isDaily = Boolean(
    property.title?.includes("يومي") ||
    property.title?.includes("يومياً") ||
    property.description?.includes("إيجار يومي") ||
    property.description?.includes("باليوم")
  );

  const handleOpenContact = (type: "PHONE_CALL" | "WHATSAPP") => {
    setContactType(type);
    setIsContactOpen(true);
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title: `${property.title} | منصة بَيْت`,
      text: `شاهد هذه الشقة المفروشة في ${property.city} (${property.district || ""}) بسعر ${property.price} ${property.currency} شهرياً على منصة بَيْت:`,
      url,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Fallback to modal
      }
    }

    setIsShareOpen(true);
  };

  const handleCopyLink = async () => {
    try {
      const url = typeof window !== "undefined" ? window.location.href : "";
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          reason: reportReason,
        }),
      });
      setReportSent(true);
      setTimeout(() => {
        setIsReportOpen(false);
        setReportSent(false);
      }, 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Owner Management Alert (If viewing own property) */}
      {isOwner && (
        <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-3.5 flex items-center justify-between text-xs font-bold text-emerald-950 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>أنت صاحب هذا الإعلان</span>
          </div>
          <Link
            href={`/properties/${property.id}/edit`}
            className="bg-brand-900 hover:bg-brand-800 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow-sm text-xs font-bold active:scale-95"
          >
            <Edit3 className="w-3.5 h-3.5" />
            تعديل تفاصيل الإعلان
          </Link>
        </div>
      )}

      {/* 2. Gallery with Floating Buttons */}
      <div className="space-y-3">
        <div className="relative h-72 sm:h-96 w-full rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 group">
          <img
            src={images[activeImageIndex]?.url}
            alt={property.title}
            className="w-full h-full object-cover"
          />

          {/* Price Badge */}
          <div className="absolute top-4 right-4 bg-brand-900/95 backdrop-blur-md text-white px-4 py-2 rounded-2xl text-base font-extrabold shadow-lg">
            {formatPrice(property.price, property.currency)}
            <span className="text-xs font-normal mr-1 text-emerald-200">{isDaily ? "/ يومياً" : "/ شهرياً"}</span>
          </div>

          {/* Floating Actions: Favorite & Share Buttons */}
          <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
            <button
              type="button"
              onClick={handleFavoriteToggle}
              aria-label="إضافة للمفضلة"
              className={`p-3 rounded-2xl backdrop-blur-md transition shadow-lg active:scale-90 flex items-center gap-1.5 text-xs font-bold ${
                isFavorite
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-white/95 hover:bg-white text-slate-800 hover:text-red-500"
              }`}
              title={isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? "fill-white" : ""}`} />
              <span className="hidden sm:inline">{isFavorite ? "في المفضلة" : "حفظ"}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              aria-label="مشاركة الإعلان"
              className="p-3 rounded-2xl bg-white/95 hover:bg-white text-slate-800 hover:text-brand-800 backdrop-blur-md transition shadow-lg active:scale-90 flex items-center gap-1.5 text-xs font-bold"
              title="مشاركة هذا الإعلان"
            >
              <Share2 className="w-4 h-4 text-brand-800" />
              <span className="hidden sm:inline">مشاركة</span>
            </button>
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img: any, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`relative w-20 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                  activeImageIndex === idx ? "border-brand-800 scale-95" : "border-transparent opacity-70"
                }`}
              >
                <img src={img.url} alt="thumb" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Title & Location & Quick Action Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
            <MapPin className="w-4 h-4 text-brand-700" />
            <span>
              {property.city} {property.district ? `• ${property.district}` : ""}
            </span>
          </div>

          {/* Share button in title row */}
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-brand-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition"
          >
            <Share2 className="w-3.5 h-3.5 text-brand-800" />
            <span>مشاركة الإعلان</span>
          </button>
        </div>

        <h1 className="text-xl font-extrabold text-slate-900 leading-snug">{property.title}</h1>

        {/* Specs */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <Bed className="w-5 h-5 text-brand-800" />
            <div>
              <span className="text-[11px] text-slate-500 block">غرف النوم</span>
              <span className="text-sm font-bold text-slate-800">
                {property.bedrooms === 1 ? "غرفة واحدة" : property.bedrooms === 2 ? "غرفتان" : `${property.bedrooms} غرف`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <Bath className="w-5 h-5 text-brand-800" />
            <div>
              <span className="text-[11px] text-slate-500 block">الحمامات</span>
              <span className="text-sm font-bold text-slate-800">
                {property.bathrooms === 1 ? "حمام واحد" : property.bathrooms === 2 ? "حمامان" : `${property.bathrooms} حمامات`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Direct Contact Bar / Actions */}
      {isGuest ? (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-700 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-extrabold text-slate-900">بيانات صاحب العقار مخفية</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              رقم هاتف المالك والتواصل المباشر عبر الاتصال والواتساب مخصص للأعضاء المسجلين. يرجى تسجيل الدخول أو إنشاء حساب مجاناً للتواصل الفوري.
            </p>
          </div>
          <Link
            href={`/login?redirect=/properties/${property.id}`}
            className="inline-flex items-center justify-center gap-2 bg-brand-800 hover:bg-brand-700 active:scale-95 text-white py-3.5 px-6 rounded-2xl text-xs font-bold transition shadow-md w-full sm:w-auto"
          >
            <LogIn className="w-4 h-4" />
            تسجيل الدخول / إنشاء حساب لإظهار رقم المالك
          </Link>
        </div>
      ) : (
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">التواصل المباشر مع صاحب العقار</span>
            {property.landlord?.name && (
              <span className="text-xs font-semibold text-brand-800 bg-brand-50 px-2.5 py-1 rounded-lg">
                المعلن: {property.landlord.name}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleOpenContact("PHONE_CALL")}
              className="flex items-center justify-center gap-2 bg-brand-800 hover:bg-brand-700 active:scale-95 text-white py-3.5 px-4 rounded-2xl text-sm font-bold transition shadow-md"
            >
              <Phone className="w-5 h-5" />
              اتصال هاتفي
            </button>

            <button
              onClick={() => handleOpenContact("WHATSAPP")}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white py-3.5 px-4 rounded-2xl text-sm font-bold transition shadow-md"
            >
              <MessageSquare className="w-5 h-5" />
              مراسلة عبر واتساب
            </button>
          </div>

          {commissionEnabled && (
            <p className="text-[11px] text-slate-500 text-center font-medium pt-1">
              * عمولة المنصة 5% على المستأجر تُدفع عند المعاينة وإتمام العقد.
            </p>
          )}
        </div>
      )}

      {/* 5. Description */}
      {property.description ? (
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-2">
          <h2 className="text-sm font-bold text-slate-900">ملاحظات وتفاصيل</h2>
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line font-medium">
            {property.description}
          </p>
        </div>
      ) : null}

      {/* 6. Amenities */}
      {property.amenities && property.amenities.length > 0 && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900">المرافق والتجهيزات المتوفرة</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {property.amenities.map((item: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl text-xs font-semibold text-slate-700 border border-slate-100"
              >
                <div className="w-2 h-2 rounded-full bg-brand-700 shrink-0"></div>
                <span>{item.amenity?.name || item.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report Button */}
      <div className="pt-2 text-center">
        <button
          onClick={() => setIsReportOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-600 font-bold transition"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          الإبلاغ عن هذا الإعلان (شقة مؤجرة / سعر غير حقيقي)
        </button>
      </div>

      {/* Direct Contact Modal */}
      <DirectContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        property={property}
        contactType={contactType}
        commissionEnabled={commissionEnabled}
        tenantCommissionPercent={tenantCommissionPercent}
      />

      {/* Share Modal */}
      {isShareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-right space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">مشاركة الإعلان</h3>
              <button
                onClick={() => setIsShareOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              يمكنك مشاركة رابط هذه الشقة مباشرة عبر واتساب أو نسخ الرابط لمشاركته مع أصدقائك:
            </p>

            <div className="space-y-2.5">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `شاهد هذه الشقة المفروشة المميزة على منصة بَيْت:\n${property.title} - ${property.city}\n${
                    typeof window !== "undefined" ? window.location.href : ""
                  }`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md"
              >
                <MessageSquare className="w-4 h-4" />
                مشاركة عبر واتساب (WhatsApp)
              </a>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={typeof window !== "undefined" ? window.location.href : ""}
                  className="flex-1 bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-xl text-xs text-slate-600 dir-ltr select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      تم النسخ
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      نسخ الرابط
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl text-right">
            <h3 className="text-sm font-bold text-slate-900 mb-3">الإبلاغ عن العقار</h3>
            {reportSent ? (
              <div className="py-6 text-center text-emerald-600 font-bold text-xs">
                تم استلام بلاغك بنجاح وسيقوم الفريق بمراجعته فوراً.
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-3">
                <label className="block text-xs font-medium text-slate-600">اختر سبب الإبلاغ:</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold"
                >
                  <option value="ALREADY_RENTED">الشقة تم تأجيرها بالفعل</option>
                  <option value="INCORRECT_PHONE">رقم الهاتف غير صحيح أو لا يرد</option>
                  <option value="MISLEADING_PRICE">السعر غير حقيقي أو مختلف</option>
                  <option value="FAKE_PHOTOS">الصور غير مطابقة للواقع</option>
                  <option value="OTHER">سبب آخر</option>
                </select>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow transition"
                  >
                    إرسال البلاغ
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsReportOpen(false)}
                    className="py-2.5 px-4 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* Login Prompt Modal for Guests attempting to favorite */}
      {showLoginModal && (
        <div
          onClick={() => setShowLoginModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto shadow-inner">
              <Heart className="w-7 h-7 fill-red-500" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-extrabold text-slate-900">سجّل دخولك لحفظ الشقة في المفضلة</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                قائمة المفضلة مخصصة للأعضاء المسجلين لحفظ الشقق ومتابعتها والرجوع إليها دائماً من أي جهاز.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <Link
                href={`/login?redirect=/properties/${property.id}`}
                className="w-full py-3 bg-brand-800 hover:bg-brand-700 active:scale-98 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow"
              >
                <LogIn className="w-4 h-4" />
                تسجيل الدخول / إنشاء حساب مجاناً
              </Link>
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
