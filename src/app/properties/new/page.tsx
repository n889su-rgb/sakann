"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Camera, Check, Plus, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { CITIES, DEFAULT_AMENITIES } from "@/lib/constants";

export default function NewPropertyPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("الخرطوم");
  const [district, setDistrict] = useState("");
  const [currency, setCurrency] = useState<"SDG" | "USD">("SDG");
  const [price, setPrice] = useState("0");
  const [bedrooms, setBedrooms] = useState("0");
  const [bathrooms, setBathrooms] = useState("0");
  const [contactPhone, setContactPhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [description, setDescription] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    "تكييف",
    "مطبخ مجهز",
  ]);
  const [images, setImages] = useState<string[]>([]);
  const [commissionAgreed, setCommissionAgreed] = useState(true);

  // Auto-fill logged-in user details if available
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          if (!contactPhone && data.user.phone) {
            setContactPhone(data.user.phone);
          }
        }
      })
      .catch(() => {});
  }, []);

  const toggleAmenity = (name: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (data.success && data.url) {
          setImages((prev) => [...prev, data.url]);
        } else {
          setError(data.error || "فشل رفع بعض الصور");
        }
      }
    } catch (err: any) {
      setError("حدث خطأ أثناء رفع الصورة من جهازك");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commissionAgreed) {
      setError("يجب الموافقة على إقرار وتعهد العمولة للمتابعة");
      return;
    }
    if (images.length === 0) {
      setError("يرجى إضافة صورة واحدة على الأقل للشقة بالنقر على زر إضافة صورة");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description.trim(),
          city,
          district: district || undefined,
          price: parseFloat(price) || 0,
          currency,
          bedrooms: parseInt(bedrooms, 10) || 0,
          bathrooms: parseInt(bathrooms, 10) || 0,
          contactPhone,
          whatsappNumber: whatsappNumber || contactPhone,
          amenities: selectedAmenities,
          images,
          commissionAgreed: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل نشر العقار");
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء حفظ العقار");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto pb-10">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
        <Link
          href="/"
          className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-extrabold text-brand-900">أضف عقار جديد</h1>
        <div className="w-10"></div>
      </div>

      {error && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-800 text-xs font-bold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Images Upload Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700">صور العقار (انقر لاختيار صور من جهازك)</label>
            <span className="text-[11px] text-slate-400 font-medium">({images.length} صور مضافة)</span>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="grid grid-cols-3 gap-3 mb-2">
            {images.map((url, idx) => (
              <div key={idx} className="relative h-24 rounded-2xl overflow-hidden border border-slate-200 group bg-slate-100">
                <img src={url} alt="Uploaded" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages(images.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 bg-red-600/90 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700 transition shadow"
                  title="حذف الصورة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {idx === 0 && (
                  <span className="absolute bottom-1 right-1 bg-brand-900/80 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                    الغلاف
                  </span>
                )}
              </div>
            ))}

            {/* Clickable Add Photo Box (Now opens real file selector!) */}
            <button
              type="button"
              disabled={uploadingImage}
              onClick={() => fileInputRef.current?.click()}
              className="h-24 border-2 border-dashed border-brand-700/60 hover:border-brand-800 bg-brand-50/50 hover:bg-brand-50 rounded-2xl flex flex-col items-center justify-center text-brand-800 transition cursor-pointer p-2 shadow-sm"
            >
              {uploadingImage ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin mb-1 text-brand-800" />
                  <span className="text-[11px] font-bold">جاري الرفع...</span>
                </>
              ) : (
                <>
                  <Camera className="w-6 h-6 mb-1 text-brand-800" />
                  <span className="text-[11px] font-bold">+ إضافة صورة</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان العقار</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-white border border-slate-200 p-3.5 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-brand-700 transition"
          />
        </div>

        {/* Location / City & District */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">المدينة</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-white border border-slate-200 p-3.5 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-brand-700"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">الحي / المنطقة</label>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full bg-white border border-slate-200 p-3.5 rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-brand-700"
            />
          </div>
        </div>

        {/* Currency Toggle */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">العملة</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setCurrency("SDG")}
              className={`py-3 rounded-2xl font-bold text-sm border transition ${
                currency === "SDG"
                  ? "bg-brand-800 text-white border-brand-800 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              جنيه سوداني
            </button>
            <button
              type="button"
              onClick={() => setCurrency("USD")}
              className={`py-3 rounded-2xl font-bold text-sm border transition ${
                currency === "USD"
                  ? "bg-brand-800 text-white border-brand-800 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              دولار أمريكي
            </button>
          </div>
        </div>

        {/* Specs: Bathrooms | Bedrooms | Price (Default 0, completely erasable) */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 text-center">حمامات</label>
            <input
              type="text"
              inputMode="numeric"
              value={bathrooms}
              onFocus={(e) => {
                if (bathrooms === "0") setBathrooms("");
                else e.target.select();
              }}
              onBlur={() => {
                if (!bathrooms.trim()) setBathrooms("0");
              }}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setBathrooms(val);
              }}
              className="w-full bg-white border border-slate-200 p-3 rounded-2xl text-center text-sm font-bold focus:ring-2 focus:ring-brand-700"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 text-center">غرف</label>
            <input
              type="text"
              inputMode="numeric"
              value={bedrooms}
              onFocus={(e) => {
                if (bedrooms === "0") setBedrooms("");
                else e.target.select();
              }}
              onBlur={() => {
                if (!bedrooms.trim()) setBedrooms("0");
              }}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setBedrooms(val);
              }}
              className="w-full bg-white border border-slate-200 p-3 rounded-2xl text-center text-sm font-bold focus:ring-2 focus:ring-brand-700"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 text-center">السعر شهرياً</label>
            <input
              type="text"
              inputMode="numeric"
              value={price}
              onFocus={(e) => {
                if (price === "0") setPrice("");
                else e.target.select();
              }}
              onBlur={() => {
                if (!price.trim()) setPrice("0");
              }}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setPrice(val);
              }}
              className="w-full bg-white border border-slate-200 p-3 rounded-2xl text-center text-sm font-bold focus:ring-2 focus:ring-brand-700 text-brand-800"
            />
          </div>
        </div>

        {/* Phone numbers with fixed +249 on left */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم الاتصال المباشر</label>
            <div
              dir="ltr"
              className="flex items-center dir-ltr bg-white border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-700"
            >
              <div className="px-3 py-3 bg-slate-50 border-r border-slate-200 text-slate-700 font-extrabold text-xs select-none shrink-0 font-mono">
                +249
              </div>
              <input
                type="tel"
                inputMode="numeric"
                required
                value={contactPhone.replace(/^(\+249|249)/, "")}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
                  setContactPhone(digits ? `249${digits}` : "");
                }}
                maxLength={9}
                className="w-full bg-transparent py-3 px-3 text-sm font-bold tracking-wider text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم الواتساب (اختياري)</label>
            <div
              dir="ltr"
              className="flex items-center dir-ltr bg-white border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-700"
            >
              <div className="px-3 py-3 bg-slate-50 border-r border-slate-200 text-slate-700 font-extrabold text-xs select-none shrink-0 font-mono">
                +249
              </div>
              <input
                type="tel"
                inputMode="numeric"
                value={whatsappNumber.replace(/^(\+249|249)/, "")}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
                  setWhatsappNumber(digits ? `249${digits}` : "");
                }}
                maxLength={9}
                className="w-full bg-transparent py-3 px-3 text-sm font-bold tracking-wider text-slate-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Note (Optional) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">ملاحظة (اختياري)</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-white border border-slate-200 p-3.5 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-brand-700"
          ></textarea>
        </div>

        {/* Amenities Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">المرافق المتوفرة</label>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_AMENITIES.map((am) => {
              const isSelected = selectedAmenities.includes(am.name);
              return (
                <button
                  key={am.name}
                  type="button"
                  onClick={() => toggleAmenity(am.name)}
                  className={`text-xs px-3.5 py-2 rounded-xl border flex items-center gap-1.5 transition ${
                    isSelected
                      ? "bg-brand-800 text-white border-brand-800 font-bold shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  {am.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Commission Agreement Box */}
        <div className="p-4 bg-emerald-50/70 border border-emerald-200/90 rounded-2xl flex items-start gap-3">
          <input
            type="checkbox"
            id="agreement"
            checked={commissionAgreed}
            onChange={(e) => setCommissionAgreed(e.target.checked)}
            className="w-5 h-5 accent-brand-800 rounded mt-0.5 cursor-pointer shrink-0"
          />
          <label htmlFor="agreement" className="text-xs text-emerald-950 leading-relaxed font-medium cursor-pointer">
            أتعهد بصفتي مالك العقار بدفع عمولة منصة بنسبة <span className="font-bold underline">5%</span> لإدارة المنصة المشرفة على تطبيق سكن في حال إتمام تأجير الشقة عبر التطبيق.
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || uploadingImage}
          className="w-full py-4 bg-brand-800 hover:bg-brand-700 active:scale-98 text-white rounded-2xl text-base font-bold shadow-lg transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              جاري النشر الفوري...
            </>
          ) : (
            "نشر العقار فوراً"
          )}
        </button>
      </form>
    </div>
  );
}
