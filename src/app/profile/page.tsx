"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Phone,
  Plus,
  LogOut,
  CheckCircle,
  Home,
  Shield,
  Loader2,
  LogIn,
  UserPlus,
  AlertCircle,
  CreditCard,
  Lock,
  KeyRound,
  CheckCircle2,
  Mail,
  ChevronDown,
  ChevronUp,
  Edit3,
  Camera,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [properties, setProperties] = useState<any[]>([]);
  const [loadingProps, setLoadingProps] = useState(false);

  // Edit Name & Phone state
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // Avatar upload state
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Change Password state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState<string | null>(null);

  // Commission settlement modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [transferRef, setTransferRef] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoadingUser(true);
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        setEditName(data.user.name || "");
        setEditPhone(data.user.phone || "");
        fetchUserProperties(data.user.id, data.user.phone);
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.error(err);
      setCurrentUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const fetchUserProperties = async (userId: string, userPhone?: string) => {
    setLoadingProps(true);
    try {
      const res = await fetch("/api/properties?status=ALL");
      const data = await res.json();
      if (data.success) {
        // Only show properties actually created by this user
        const myProps = data.properties.filter((p: any) => p.landlordId === userId);
        setProperties(myProps);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProps(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfileInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    setEditSuccess(null);
    setEditLoading(true);

    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          phone: editPhone.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل تحديث البيانات");
      }

      setEditSuccess("تم تحديث الاسم ورقم الهاتف بنجاح!");
      setCurrentUser({
        ...currentUser,
        name: data.user.name,
        phone: data.user.phone,
      });
      setIsEditingInfo(false);
    } catch (err: any) {
      setEditError(err.message || "حدث خطأ أثناء التحديث");
    } finally {
      setEditLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setEditError("حجم الصورة كبير جداً، الحد الأقصى المسموح 5 ميجابايت");
      return;
    }

    setAvatarUploading(true);
    setEditError(null);
    setEditSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.success) {
        throw new Error(uploadData.error || "فشل رفع الصورة");
      }

      const newAvatarUrl = uploadData.url;

      const updateRes = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatarUrl: newAvatarUrl,
        }),
      });

      const updateData = await updateRes.json();
      if (!updateRes.ok || !updateData.success) {
        throw new Error(updateData.error || "فشل حفظ صورة البروفايل");
      }

      setCurrentUser((prev: any) => ({
        ...prev,
        avatarUrl: newAvatarUrl,
      }));
      setEditSuccess("تم تحديث صورة الملف الشخصي بنجاح! 📸");
      router.refresh();
    } catch (err: any) {
      setEditError(err.message || "حدث خطأ أثناء رفع الصورة الشخصية");
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm("هل أنت متأكد من حذف صورتك الشخصية؟")) return;
    setAvatarUploading(true);
    setEditError(null);
    setEditSuccess(null);

    try {
      const updateRes = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatarUrl: null,
        }),
      });

      const updateData = await updateRes.json();
      if (!updateRes.ok || !updateData.success) {
        throw new Error(updateData.error || "فشل حذف صورة البروفايل");
      }

      setCurrentUser((prev: any) => ({
        ...prev,
        avatarUrl: null,
      }));
      setEditSuccess("تم حذف الصورة الشخصية بنجاح");
      router.refresh();
    } catch (err: any) {
      setEditError(err.message || "حدث خطأ أثناء حذف الصورة");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(null);

    if (newPassword !== confirmNewPassword) {
      setPwError("كلمتا المرور الجديدتان غير متطابقتين");
      return;
    }

    if (newPassword.length < 6) {
      setPwError("كلمة المرور الجديدة يجب ألا تقل عن 6 أحرف");
      return;
    }

    setPwLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل تغيير كلمة المرور");
      }

      setPwSuccess(data.message || "تم تغيير كلمة المرور بنجاح!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      setPwError(err.message || "حدث خطأ أثناء تغيير كلمة المرور");
    } finally {
      setPwLoading(false);
    }
  };

  const togglePropertyStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "RENTED" : "ACTIVE";
    try {
      await fetch(`/api/admin/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (currentUser) fetchUserProperties(currentUser.id);
    } catch (err) {
      console.error(err);
    }
  };

  if (loadingUser) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-700" />
        <span className="text-xs font-semibold">جاري تحميل بيانات حسابك...</span>
      </div>
    );
  }

  // GUEST STATE (NOT LOGGED IN)
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto pt-4 pb-12 space-y-6">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-brand-50 text-brand-800 flex items-center justify-center mx-auto shadow-inner">
            <User className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-extrabold text-slate-900">سجّل دخولك لمتابعة حسابك</h1>
            <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">
              سجّل الدخول لإدارة شققك المفروشة، تعديل الأسعار، ومتابعة الاتصالات وسداد العمولات.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href="/login"
              className="w-full py-3.5 bg-brand-800 hover:bg-brand-700 active:scale-98 text-white rounded-2xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              تسجيل الدخول
            </Link>

            <Link
              href="/register"
              className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 active:scale-98 text-slate-700 border border-slate-200 rounded-2xl text-sm font-bold transition flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4 text-brand-800" />
              إنشاء حساب جديد مجاناً
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // LOGGED IN STATE
  const isAdmin = currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN";

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-10">
      <div className="flex items-center justify-between pb-2">
        <h1 className="text-xl font-extrabold text-brand-900">حسابي</h1>
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-1.5 rounded-xl transition shadow-sm"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            لوحة الإدارة
          </Link>
        )}
      </div>

      {editSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{editSuccess}</span>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {/* User Avatar with photo picker */}
            <div className="relative group shrink-0">
              <div
                onClick={() => avatarInputRef.current?.click()}
                className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-800 flex items-center justify-center font-bold text-xl shadow-inner overflow-hidden border border-brand-200 cursor-pointer relative hover:opacity-95 transition"
                title="اضغط لرفع أو تغيير الصورة الشخصية"
              >
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-brand-800" />
                )}

                {avatarUploading && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center rounded-2xl">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                )}
              </div>

              {/* Camera Icon Button */}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                title="تغيير الصورة الشخصية"
                className="absolute -bottom-1 -left-1 w-6 h-6 bg-brand-800 hover:bg-brand-700 active:scale-95 text-white rounded-lg shadow-md border-2 border-white transition flex items-center justify-center cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-extrabold text-slate-900 text-base">{currentUser.name}</h2>
                {isAdmin && (
                  <span className="bg-slate-900 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                    مشرف
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500 font-medium block">مؤجر ومعلن معتمد في سكن</span>
              {currentUser.avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={avatarUploading}
                  className="text-[11px] font-bold text-red-500 hover:text-red-700 transition mt-0.5 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>حذف الصورة</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsEditingInfo(!isEditingInfo);
                setEditName(currentUser.name || "");
                setEditPhone(currentUser.phone || "");
              }}
              className="flex items-center gap-1 text-xs font-bold text-brand-800 bg-brand-50 hover:bg-brand-100 px-3 py-2 rounded-xl transition"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingInfo ? "إلغاء" : "تعديل"}</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
              <span>خروج</span>
            </button>
          </div>
        </div>

        {/* Edit Form Drawer */}
        {isEditingInfo && (
          <form onSubmit={handleSaveProfileInfo} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3 pt-3">
            <div className="text-xs font-bold text-slate-800">تعديل البيانات الشخصية</div>

            {editError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-bold">
                {editError}
              </div>
            )}

            {/* Profile Picture Option in Drawer */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">صورة البروفايل</label>
              <div className="flex items-center gap-3 p-2.5 bg-white border border-slate-200 rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-800 flex items-center justify-center overflow-hidden border border-brand-100 shrink-0">
                  {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="py-1.5 px-3 bg-brand-50 hover:bg-brand-100 text-brand-800 text-xs font-bold rounded-lg transition flex items-center gap-1"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{currentUser.avatarUrl ? "تغيير الصورة" : "رفع صورة"}</span>
                  </button>
                  {currentUser.avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      disabled={avatarUploading}
                      className="py-1.5 px-2 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>حذف</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">الاسم بالكامل</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-white border border-slate-200 py-2 px-3 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-brand-700"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">رقم الهاتف للتواصل</label>
              <input
                type="tel"
                required
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+249"
                className="w-full bg-white border border-slate-200 py-2 px-3 rounded-xl text-xs font-semibold dir-ltr text-right focus:ring-2 focus:ring-brand-700"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={editLoading}
                className="flex-1 py-2.5 bg-brand-800 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 transition active:scale-[0.99]"
              >
                {editLoading && <Loader2 className="w-3.5 h-3.5 animate-spin ml-1.5" />}
                <span>حفظ التعديلات</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditingInfo(false)}
                className="py-2.5 px-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Account Info Box (Phone & Email) */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
        {currentUser.phone ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center border border-slate-100">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-bold">رقم الهاتف للتواصل المباشر</span>
                <span className="text-sm font-bold text-slate-800 dir-ltr block text-right">
                  {currentUser.phone}
                </span>
              </div>
            </div>

            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
              معتمد للاتصال ✓
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-extrabold text-amber-900 block">لم يتم ربط رقم هاتف بعد</span>
                <span className="text-[11px] text-amber-700 font-medium block">
                  يمكنك إضافة رقم هاتفك الآن لتسهيل الاتصال والواتساب
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsEditingInfo(true);
                setEditPhone("");
              }}
              className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl transition shadow-sm shrink-0"
            >
              + إضافة رقم
            </button>
          </div>
        )}

        {currentUser.email && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center border border-slate-100">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-bold">البريد الإلكتروني المعتمد</span>
                <span className="text-xs font-bold text-slate-800 dir-ltr block text-right font-mono">
                  {currentUser.email}
                </span>
              </div>
            </div>

            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
              Google ✓
            </span>
          </div>
        )}
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowPasswordSection(!showPasswordSection)}
          className="w-full p-4.5 flex items-center justify-between text-right hover:bg-slate-50 transition p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-800 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 block">تغيير كلمة المرور</span>
              <span className="text-[11px] text-slate-400">تحديث كلمة المرور لحماية وتأمين حسابك</span>
            </div>
          </div>

          <div className="text-slate-400">
            {showPasswordSection ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>

        {showPasswordSection && (
          <div className="p-5 pt-0 border-t border-slate-100">
            {pwError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-red-800 text-xs font-bold my-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pwError}</span>
              </div>
            )}

            {pwSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-bold my-3">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{pwSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5 mt-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">كلمة المرور الحالية</label>
                <div className="relative">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 py-2.5 pr-9 pl-3 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-brand-700 focus:bg-white transition"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">كلمة المرور الجديدة</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 py-2.5 pr-9 pl-3 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-brand-700 focus:bg-white transition"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">تأكيد كلمة المرور الجديدة</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 py-2.5 pr-9 pl-3 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-brand-700 focus:bg-white transition"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                disabled={pwLoading}
                className="w-full py-3 bg-brand-800 hover:bg-brand-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow transition flex items-center justify-center gap-2 mt-2"
              >
                {pwLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري التحديث...
                  </>
                ) : (
                  "حفظ كلمة المرور الجديدة"
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* My Properties Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">عقاراتي ({properties.length})</h3>
          <Link
            href="/properties/new"
            className="flex items-center gap-1 text-xs font-bold text-brand-800 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-xl transition"
          >
            <Plus className="w-4 h-4" />
            إضافة عقار جديد
          </Link>
        </div>

        {loadingProps ? (
          <div className="py-10 text-center text-slate-400 text-xs">جاري تحميل عقاراتك...</div>
        ) : properties.length === 0 ? (
          <div className="p-8 bg-white rounded-3xl border border-slate-200/80 text-center text-slate-400 text-xs space-y-3">
            <p>لم تقم بإضافة أي عقار بعد</p>
            <Link
              href="/properties/new"
              className="inline-flex items-center gap-1.5 bg-brand-800 text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              <Plus className="w-4 h-4" />
              أضف عقارك الأول الآن
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {properties.map((p) => (
              <div
                key={p.id}
                className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                    <img
                      src={
                        p.images[0]?.url ||
                        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80"
                      }
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-xs truncate">{p.title}</h4>
                    <span className="text-[11px] text-slate-500 block">
                      {p.city} • {formatPrice(p.price, p.currency)}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          p.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {p.status === "ACTIVE" ? "متاح للاتصال" : "تم التأجير"}
                      </span>
                      <span className="text-[10px] text-slate-400">{p.leadsCount || 0} نقرة اتصال</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  <Link
                    href={`/properties/${p.id}/edit`}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-brand-800 hover:bg-brand-700 text-white transition text-center flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Edit3 className="w-3 h-3" />
                    تعديل الإعلان
                  </Link>

                  <button
                    onClick={() => togglePropertyStatus(p.id, p.status)}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
                  >
                    {p.status === "ACTIVE" ? "إيقاف (مؤجر)" : "تفعيل (متاح)"}
                  </button>

                  <button
                    onClick={() => {
                      setSelectedPropertyId(p.id);
                      setShowPaymentModal(true);
                    }}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-brand-50 text-brand-800 hover:bg-brand-100 transition"
                  >
                    سداد العمولة (بنكك)
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Receipt Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl text-right">
            <h3 className="text-sm font-bold text-slate-900 mb-2">سداد عمولة المنصة (5%)</h3>
            <p className="text-xs text-slate-600 mb-3">
              قم بتحويل العمولة عبر تطبيق بنكك إلى الحساب أدناه، ثم أدخل رقم العملية لتأكيد السداد:
            </p>

            <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 mb-4 text-xs font-bold text-emerald-950">
              <div>حساب بنكك: <span className="dir-ltr inline-block">2345678</span></div>
              <div>الاسم: منصة سكن العقارية</div>
            </div>

            {paymentSuccess ? (
              <div className="py-4 text-center text-emerald-600 font-bold text-xs">
                تم استلام إشعار السداد بنجاح! شكراً لأمانتك.
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={transferRef}
                  onChange={(e) => setTransferRef(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold"
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setPaymentSuccess(true);
                      setTimeout(() => {
                        setShowPaymentModal(false);
                        setPaymentSuccess(false);
                      }, 2000);
                    }}
                    className="flex-1 py-2.5 bg-brand-800 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow"
                  >
                    تأكيد السداد
                  </button>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="py-2.5 px-4 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
