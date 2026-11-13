"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, ArrowRight, Loader2, Home } from "lucide-react";
import { PropertyCard } from "@/components/PropertyCard";
import { DirectContactModal } from "@/components/DirectContactModal";
import { useFavorites } from "@/lib/favorites";

export default function FavoritesPage() {
  const { favorites, mounted } = useFavorites();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  // Contact Modal State
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [contactType, setContactType] = useState<"PHONE_CALL" | "WHATSAPP">("PHONE_CALL");

  useEffect(() => {
    fetch("/api/properties?status=ALL")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProperties(data.properties || []);
          setIsGuest(Boolean(data.isGuest));
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const favoriteProperties = properties.filter((p) => favorites.includes(p.id));

  const handleContactClick = (property: any, type: "PHONE_CALL" | "WHATSAPP") => {
    setSelectedProperty(property);
    setContactType(type);
    setIsContactOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <Link
          href="/"
          className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5">
            <Heart className="w-5 h-5 fill-red-500 text-red-500" />
            <h1 className="text-lg font-extrabold text-brand-900">إعلاناتي المفضلة</h1>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            الشقق التي قمت بحفظها للرجوع إليها لاحقاً
          </span>
        </div>
        <div className="w-10"></div>
      </div>

      {loading || !mounted ? (
        <div className="py-24 text-center flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-700" />
          <span className="text-xs font-semibold">جاري تحميل المفضلة...</span>
        </div>
      ) : favoriteProperties.length === 0 ? (
        <div className="max-w-md mx-auto py-16 px-6 bg-white rounded-3xl border border-slate-200/90 shadow-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center mx-auto shadow-inner">
            <Heart className="w-8 h-8 stroke-[1.5]" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-base font-extrabold text-slate-900">لا توجد إعلانات في المفضلة بعد</h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              أثناء تصفحك للشقق المفروشة، اضغط على أيقونة القلب ❤️ في أي إعلان لحفظه والوصول إليه بسرعة في أي وقت.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-brand-800 hover:bg-brand-700 active:scale-98 text-white py-3 px-6 rounded-2xl text-xs font-bold transition shadow-md"
          >
            <Home className="w-4 h-4" />
            تصفح الشقق الآن
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
            <span>لديك ({favoriteProperties.length}) شقق محفوظة في المفضلة</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {favoriteProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onContactClick={handleContactClick}
                isGuest={isGuest}
              />
            ))}
          </div>
        </div>
      )}

      {/* Direct Contact Modal */}
      {selectedProperty && (
        <DirectContactModal
          isOpen={isContactOpen}
          onClose={() => setIsContactOpen(false)}
          property={selectedProperty}
          contactType={contactType}
          commissionEnabled={true}
          tenantCommissionPercent={5.0}
        />
      )}
    </div>
  );
}
