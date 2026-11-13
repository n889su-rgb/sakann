"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Check,
  Plus,
  Loader2,
  AlertCircle,
  Trash2,
  Save,
  CheckCircle2,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { CITIES, DEFAULT_AMENITIES } from "@/lib/constants";

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params?.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

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
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (!propertyId) return;

    fetch(`/api/properties/${propertyId}`)
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          setUnauthorized(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data || !data.success || !data.property) {
          if (!unauthorized) setError(data?.error || "فشل تحميل بيانات العقار");
          return;
        }

        const p = data.property;
        setTitle(p.title || "");
        setCity(p.city || "الخرطوم");
        setDistrict(p.district || "");
        setCurrency(p.currency === "USD" ? "USD" : "SDG");
        setPrice(String(p.price || 0));
        setBedrooms(String(p.bedrooms || 0));
        setBathrooms(String(p.bathrooms || 0));
        setContactPhone(p.contactPhone || "");
        setWhatsappNumber(p.whatsappNumber || p.contactPhone || "");
        setDescription(p.description || "");

        // Amenities
        const amenityNames = p.amenities?.map((a: any) => a.amenity?.name || a.name) || [];
        setSelectedAmenities(amenityNames);

        // Images
        const imgUrls = p.images?.map((img: any) => img.url) || [];
        setImages(imgUrls);
      })
      .catch((err) => {
        console.error(err);
        setError("حدث خطأ أثناء تحميل بيانات العقار");
      })
      .finally(() => {
        setInitialLoading(false);
      });
  }, [propertyId]);

  const toggleAmenity = (name: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  const handleRemoveImage = (indexToRemove: number) => {
    if (images.length <= 1) {
      setError("يجب الإبقاء على صورة واحدة على الأقل للشقة");
      return;
    }
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
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
    if (images.length === 0) {
      setError("يرجى إضافة صورة واحدة على الأقل للشقة");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: "PUT",
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
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل تحديث بيانات الإعلان");
      }

      setSuccess("تم حفظ التعديلات بنجاح! جاري تحويلك للصفحة...");
      setTimeout(() => {
        router.push(`/properties/${propertyId}`);
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء حفظ التعديلات");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل حذف العقار");
      }
      router.push("/profile");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء حذف العقار");
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-700" />
        <span className="text-xs font-semibold">جاري تحميل بيانات الشقة للتعديل...</span>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-900">غير مصرح لك بتعديل هذا الإعلان</h2>
        <p className="text-xs text-slate-500">
          تعديل الإعلان متاح فقط لصاحب الشقة الذي قام بنشرها أو مشرفي المنصة.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-brand-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow"
        >
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto pb-12">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-extrabold text-brand-900">تعديل الإعلان</h1>
          <span className="text-[11px] text-slate-400 font-medium block">تحديث تفاصيل الشقة والأسعار</span>
        </div>
        <Link
          href={`/properties/${propertyId}`}
          className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition"
          title="معاينة الإعلان"
        >
          <Eye className="w-4 h-4" />
        </Link>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-red-800 text-xs font-bold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Photos Section */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-bold text-slate-900 block">صور الشقة المعروضة</label>
              <span className="text-[11px] text-slate-400">يمكنك حذف صور قديمة أو رفع صور جديدة (الأولى هي الرئيسية)</span>
            </div>
            <span className="text-xs font-bold text-brand-800 bg-brand-50 px-2.5 py-1 rounded-lg">
              {images.length} صور
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {images.map((imgUrl, idx) => (
              <div
                key={idx}
                className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 group bg-slate-100"
              >
                <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                {idx === 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-brand-900/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                    الرئيسية
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute bottom-1.5 left-1.5 bg-red-600/90 hover:bg-red-700 text-white p-1 rounded-lg backdrop-blur-sm transition opacity-90 hover:opacity-100"
                  title="حذف الصورة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Add More Photos Button */}
            <label className="aspect-video rounded-2xl border-2 border-dashed border-slate-300 hover:border-brand-600 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-slate-100 transition group">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                multiple
                onChange={handleFileChange}
                disabled={uploadingImage}
                className="hidden"
              />
              {uploadingImage ? (
                <Loader2 className="w-5 h-5 text-brand-700 animate-spin" />
              ) : (
                <>
                  <Camera className="w-5 h-5 text-slate-400 group-hover:text-brand-700 mb-1" />
                  <span className="text-[10px] font-bold text-slate-500 group-hover:text-brand-800">
                    + إضافة صور
                  </span>
                </>
              )}
            </label>
          </div>
        </div>

        {/* 2. Main Details */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900">المعلومات الأساسية</h2>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان الإعلان</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-brand-700 focus:bg-white transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">المدينة</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-brand-700 focus:bg-white transition"
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
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-brand-700 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Price & Currency */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">الإيجار الشهري</label>
            <div className="flex gap-2">
              <input
                type="number"
                required
                min="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-brand-700 focus:bg-white transition"
              />
              <div className="flex bg-slate-100 p-1 rounded-2xl shrink-0">
                <button
                  type="button"
                  onClick={() => setCurrency("SDG")}
                  className={`px-3 py-2 rounded-xl text-xs font-extrabold transition ${
                    currency === "SDG" ? "bg-brand-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  جنيه (SDG)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency("USD")}
                  className={`px-3 py-2 rounded-xl text-xs font-extrabold transition ${
                    currency === "USD" ? "bg-brand-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  دولار ($)
                </button>
              </div>
            </div>
          </div>

          {/* Rooms */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">عدد غرف النوم</label>
              <input
                type="number"
                min="0"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-brand-700 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">عدد الحمامات</label>
              <input
                type="number"
                min="0"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-brand-700 focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        {/* 3. Contact Numbers */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900">أرقام التواصل مع المستأجرين</h2>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم الاتصال الهاتفي</label>
            <input
              type="text"
              required
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-brand-700 focus:bg-white transition text-left dir-ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم الواتساب (اختياري)</label>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="نفس رقم الهاتف إذا ترك فارغاً"
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-brand-700 focus:bg-white transition text-left dir-ltr"
            />
          </div>
        </div>

        {/* 4. Amenities Checklist */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <label className="text-sm font-bold text-slate-900 block">الميزات والخدمات المتوفرة</label>
          <div className="grid grid-cols-2 gap-2">
            {DEFAULT_AMENITIES.map((am) => {
              const isSelected = selectedAmenities.includes(am.name);
              return (
                <button
                  type="button"
                  key={am.name}
                  onClick={() => toggleAmenity(am.name)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition ${
                    isSelected
                      ? "bg-brand-50 border-brand-700 text-brand-900 font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-md flex items-center justify-center border transition ${
                      isSelected ? "bg-brand-800 border-brand-800 text-white" : "border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span>{am.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Description */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
          <label className="text-sm font-bold text-slate-900 block">تفاصيل ووصف الشقة</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-brand-700 focus:bg-white transition"
          />
        </div>

        {/* Actions Bar */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3.5 bg-brand-800 hover:bg-brand-700 active:scale-98 text-white rounded-2xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري حفظ التعديلات...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                حفظ التعديلات
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="py-3.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 rounded-2xl text-xs font-bold border border-red-200 transition flex items-center gap-1.5 shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            حذف الإعلان
          </button>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-extrabold text-slate-900">هل أنت متأكد من حذف هذا الإعلان؟</h3>
              <p className="text-xs text-slate-500">
                سيتم حذف الشقة بشكل نهائي من المنصة ولن تظهر في نتائج البحث.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "نعم، احذف الإعلان"}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
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
