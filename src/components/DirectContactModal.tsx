"use client";

import { useState } from "react";
import { X, Phone, MessageSquare, AlertCircle, CheckCircle } from "lucide-react";

interface DirectContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: {
    id: string;
    title: string;
    contactPhone: string;
    whatsappNumber?: string | null;
  } | null;
  contactType: "PHONE_CALL" | "WHATSAPP";
  commissionEnabled: boolean;
  tenantCommissionPercent: number;
}

export function DirectContactModal({
  isOpen,
  onClose,
  property,
  contactType,
  commissionEnabled,
  tenantCommissionPercent,
}: DirectContactModalProps) {
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !property) return null;

  const handleProceed = async () => {
    setLoading(true);
    try {
      // 1. Record lead tracking in background
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          type: contactType,
        }),
      });
    } catch (err) {
      console.error("Lead tracking error:", err);
    } finally {
      setLoading(false);
      onClose();

      const phoneToUse =
        contactType === "WHATSAPP"
          ? property.whatsappNumber || property.contactPhone
          : property.contactPhone;

      if (!phoneToUse || phoneToUse === "مخفي للضيوف") {
        window.location.href = `/login?redirect=/properties/${property.id}`;
        return;
      }

      // Clean phone number
      const cleaned = phoneToUse.replace(/[^0-9]/g, "");

      if (contactType === "PHONE_CALL") {
        window.location.href = `tel:${cleaned}`;
      } else {
        const text = encodeURIComponent(
          `السلام عليكم، بخصوص إعلانكم على منصة سكن: "${property.title}"، هل الشقة ما زالت متاحة للمعاينة؟`
        );
        window.open(`https://wa.me/${cleaned.startsWith("0") ? "249" + cleaned.slice(1) : cleaned}?text=${text}`, "_blank");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 flex flex-col text-right">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm">
              {contactType === "PHONE_CALL" ? "الاتصال بصاحب الشقة" : "مراسلة المالك عبر واتساب"}
            </span>
            <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-800 flex items-center justify-center">
              {contactType === "PHONE_CALL" ? <Phone className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {/* Commission Reminder (Honor System) */}
        {commissionEnabled && (
          <div className="my-4 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 leading-relaxed font-medium">
              <span className="font-bold block text-emerald-950 mb-0.5">العمولة أمانة في ذمتك:</span>
              يستحق للمنصة عمولة بنسبة <span className="font-bold underline">{tenantCommissionPercent}%</span> من قيمة الإيجار تدفع عند إتمام الصفقة واستلام الشقة.
            </div>
          </div>
        )}

        {/* Property quick info */}
        <div className="bg-slate-50 p-3 rounded-xl mb-4 border border-slate-100">
          <span className="text-[11px] text-slate-500 block">العقار المطلوب:</span>
          <span className="text-xs font-bold text-slate-800 line-clamp-1">{property.title}</span>
          <span className="text-xs font-semibold text-brand-800 block mt-1 dir-ltr text-right">
            رقم المالك: {property.contactPhone}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleProceed}
            disabled={loading}
            className="w-full py-3 bg-brand-800 hover:bg-brand-700 active:scale-98 text-white rounded-xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2"
          >
            {contactType === "PHONE_CALL" ? (
              <>
                <Phone className="w-4 h-4" />
                اتصال الآن بالرقم
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4" />
                فتح محادثة واتساب
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 text-slate-500 hover:text-slate-700 text-xs font-semibold transition"
          >
            إلغاء والعودة
          </button>
        </div>
      </div>
    </div>
  );
}
