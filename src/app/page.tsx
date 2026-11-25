"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, Home as HomeIcon, AlertCircle, Loader2, RotateCcw, Search } from "lucide-react";
import { SearchAndFilter } from "@/components/SearchAndFilter";
import { PropertyCard } from "@/components/PropertyCard";
import { DirectContactModal } from "@/components/DirectContactModal";

export default function HomePage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [contactType, setContactType] = useState<"PHONE_CALL" | "WHATSAPP">("PHONE_CALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [commissionSettings, setCommissionSettings] = useState({
    commissionEnabled: true,
    tenantCommissionPercent: 5.0,
  });
  const [activeFilters, setActiveFilters] = useState<any>(null);

  const fetchProperties = async (filters?: any) => {
    setActiveFilters(filters || null);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.append("search", filters.search);
      if (filters?.city) params.append("city", filters.city);
      if (filters?.currency) params.append("currency", filters.currency);
      if (filters?.maxPrice) params.append("maxPrice", filters.maxPrice.toString());
      if (filters?.bedrooms) params.append("bedrooms", filters.bedrooms.toString());

      const res = await fetch(`/api/properties?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProperties(data.properties);
        if (typeof data.isGuest === "boolean") {
          setIsGuest(data.isGuest);
        }
      }
    } catch (err) {
      console.error("Error fetching properties:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.success && data.settings) {
        setCommissionSettings({
          commissionEnabled: data.settings.commissionEnabled,
          tenantCommissionPercent: data.settings.tenantCommissionPercent,
        });
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    }
  };

  useEffect(() => {
    fetchProperties();
    fetchSettings();

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setIsGuest(!data.success || !data.user);
      })
      .catch(() => setIsGuest(true));
  }, []);

  const handleContactClick = (property: any, type: "PHONE_CALL" | "WHATSAPP") => {
    setSelectedProperty(property);
    setContactType(type);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Commission Alert Banner (if commission disabled, e.g. Free Launch) */}
      {!commissionSettings.commissionEnabled && (
        <div className="bg-emerald-500 text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🎉</span>
            <span>عرض الإطلاق الحصري: المنصة مجانية بالكامل حالياً بدون أي عمولة!</span>
          </div>
          <span className="bg-white/20 px-2.5 py-0.5 rounded-lg text-[10px]">0% عمولة</span>
        </div>
      )}

      {/* Search & Filter Component */}
      <SearchAndFilter onFilterChange={fetchProperties} />

      {/* Properties Feed Section */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-700" />
          <span className="text-xs font-semibold">جاري تحميل الشقق المتوفرة...</span>
        </div>
      ) : properties.length === 0 ? (
        activeFilters && (activeFilters.search || activeFilters.city || activeFilters.currency || activeFilters.maxPrice > 0 || activeFilters.bedrooms > 0 || (activeFilters.amenities && activeFilters.amenities.length > 0)) ? (
          /* Search Empty State */
          <div className="py-16 px-4 bg-white rounded-3xl border border-slate-200/90 text-center flex flex-col items-center justify-center shadow-sm animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-200">
              <Search className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">لا توجد شقق مطابقة لخيارات البحث</h3>
            <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
              لم نعثر على شقق تطابق معايير الفلترة المحددة. جرب اختيار مدينة أخرى أو تقليل عدد الغرف لإظهار المزيد من النتائج.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => {
                  setActiveFilters(null);
                  fetchProperties();
                }}
                className="inline-flex items-center gap-2 bg-brand-800 hover:bg-brand-700 active:scale-95 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-md transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                إعادة ضبط الفلاتر وعرض الكل
              </button>
              <Link
                href="/properties/new"
                className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-2xl text-xs font-bold transition"
              >
                <PlusCircle className="w-4 h-4" />
                أضف شقة في هذه المنطقة
              </Link>
            </div>
          </div>
        ) : (
          /* General Empty State */
          <div className="py-16 px-4 bg-white rounded-3xl border border-slate-200/90 text-center flex flex-col items-center justify-center shadow-sm">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
              <HomeIcon className="w-10 h-10 stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-bold text-brand-900 mb-1">لا توجد عقارات بعد</h3>
            <p className="text-xs text-slate-500 max-w-xs mb-6">
              كن أول من يضيف شقة مفروشة للإيجار على بيت وتواصل مع مئات المستأجرين يومياً.
            </p>
            <Link
              href="/properties/new"
              className="inline-flex items-center gap-2 bg-brand-800 hover:bg-brand-700 active:scale-95 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-md transition"
            >
              <PlusCircle className="w-5 h-5" />
              أضف عقارك الأول
            </Link>
          </div>
        )
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">
              الشقق المتاحة حالياً ({properties.length})
            </h2>
            <span className="text-xs text-brand-800 font-semibold bg-brand-50 px-2.5 py-1 rounded-lg">
              نشر فوري ومباشر
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {properties.map((property) => (
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
      <DirectContactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        property={selectedProperty}
        contactType={contactType}
        commissionEnabled={commissionSettings.commissionEnabled}
        tenantCommissionPercent={commissionSettings.tenantCommissionPercent}
      />
    </div>
  );
}
