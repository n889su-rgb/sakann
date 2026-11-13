"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Bed,
  Bath,
  Phone,
  MessageSquare,
  Zap,
  Sun,
  Wifi,
  Shield,
  Lock,
  Heart,
  Share2,
  Check,
  LogIn,
  X,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useFavorites } from "@/lib/favorites";

interface PropertyCardProps {
  property: {
    id: string;
    title: string;
    city: string;
    district?: string | null;
    price: number;
    currency: string;
    bedrooms: number;
    bathrooms: number;
    contactPhone: string;
    whatsappNumber?: string | null;
    status: string;
    images: { url: string }[];
    amenities: { amenity: { name: string; icon: string } }[];
  };
  onContactClick: (property: any, type: "PHONE_CALL" | "WHATSAPP") => void;
  isGuest?: boolean;
}

export function PropertyCard({ property, onContactClick, isGuest }: PropertyCardProps) {
  const coverImage =
    property.images[0]?.url ||
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80";

  const { isFav, toggle, mounted } = useFavorites();
  const isFavorite = mounted && !isGuest && isFav(property.id);
  const [copied, setCopied] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const url = typeof window !== "undefined" ? `${window.location.origin}/properties/${property.id}` : "";
    const shareData = {
      title: `${property.title} | منصة سكن`,
      text: `شاهد هذه الشقة المفروشة في ${property.city} (${property.district || ""}) بسعر ${property.price} ${property.currency} شهرياً:`,
      url,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User dismissed share
      }
    }

    // Fallback: Copy link
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isGuest) {
      setShowLoginModal(true);
      return;
    }

    toggle(property.id);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden hover:shadow-md transition flex flex-col group">
      {/* Property Image Link */}
      <Link href={`/properties/${property.id}`} className="relative block h-52 w-full bg-slate-100 overflow-hidden">
        <img
          src={coverImage}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />

        {/* Currency & Price Badge */}
        <div className="absolute top-3 right-3 bg-brand-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-sm font-bold shadow-md">
          {formatPrice(property.price, property.currency)}
          <span className="text-[10px] font-normal mr-1 text-emerald-200">/ شهرياً</span>
        </div>

        {/* Status Badge */}
        {property.status === "ACTIVE" ? (
          <div className="absolute top-3 left-3 bg-emerald-500/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-sm">
            متاح للحجز الفوري
          </div>
        ) : (
          <div className="absolute top-3 left-3 bg-slate-800/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
            تم التأجير
          </div>
        )}

        {/* Floating Quick Action Buttons: Favorite & Share */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 z-10">
          <button
            type="button"
            onClick={handleFavoriteClick}
            aria-label="إضافة إلى المفضلة"
            className={`p-2 rounded-xl backdrop-blur-md transition shadow-md active:scale-90 ${
              isFavorite
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-white/90 hover:bg-white text-slate-700 hover:text-red-500"
            }`}
            title={isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? "fill-white" : ""}`} />
          </button>

          <button
            type="button"
            onClick={handleShare}
            aria-label="مشاركة الإعلان"
            className="p-2 rounded-xl bg-white/90 hover:bg-white text-slate-700 hover:text-brand-800 backdrop-blur-md transition shadow-md active:scale-90"
            title="مشاركة رابط الإعلان"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </Link>

      {/* Property Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1.5 font-medium">
            <MapPin className="w-3.5 h-3.5 text-brand-700" />
            <span>
              {property.city} {property.district ? `• ${property.district}` : ""}
            </span>
          </div>

          <Link href={`/properties/${property.id}`}>
            <h3 className="font-bold text-slate-900 text-base line-clamp-1 hover:text-brand-800 transition">
              {property.title}
            </h3>
          </Link>

          {/* Rooms and Specs */}
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-600 font-semibold bg-slate-50 p-2 rounded-xl">
            <div className="flex items-center gap-1">
              <Bed className="w-4 h-4 text-brand-700" />
              <span>{property.bedrooms} غرف</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="w-4 h-4 text-brand-700" />
              <span>{property.bathrooms} حمامات</span>
            </div>
          </div>

          {/* Key Amenities Preview */}
          {property.amenities.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
              {property.amenities.slice(0, 4).map((item, idx) => (
                <span
                  key={idx}
                  className="bg-brand-50 text-brand-800 text-[11px] font-semibold px-2 py-0.5 rounded-md"
                >
                  {item.amenity.name}
                </span>
              ))}
              {property.amenities.length > 4 && (
                <span className="text-[11px] text-slate-400 font-bold">
                  +{property.amenities.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Direct Action Buttons: Hidden for Guests */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          {isGuest ? (
            <Link
              href={`/login?redirect=/properties/${property.id}`}
              className="w-full flex items-center justify-center gap-2 bg-slate-50 hover:bg-brand-50 text-slate-700 hover:text-brand-900 border border-slate-200/90 py-2.5 px-3 rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Lock className="w-3.5 h-3.5 text-brand-700" />
              <span>بيانات المالك مخفية • سجل دخول للتواصل</span>
            </Link>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onContactClick(property, "PHONE_CALL")}
                className="flex items-center justify-center gap-1.5 bg-brand-800 hover:bg-brand-700 active:scale-95 text-white py-2.5 px-3 rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Phone className="w-4 h-4" />
                اتصال هاتفي
              </button>

              <button
                onClick={() => onContactClick(property, "WHATSAPP")}
                className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white py-2.5 px-3 rounded-xl text-xs font-bold transition shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                واتساب المالك
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Login Prompt Modal for Guests attempting to favorite */}
      {showLoginModal && (
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowLoginModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
            }}
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
