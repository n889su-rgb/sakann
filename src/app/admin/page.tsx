"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import * as XLSX from "xlsx";
import {
  Shield,
  Sliders,
  Power,
  Percent,
  Home,
  PhoneCall,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Ban,
  Save,
  Loader2,
  RefreshCw,
  Lock,
  LogIn,
  LogOut,
  MessageSquare,
  Clock,
  User,
  ExternalLink,
  Users,
  Search,
  Building2,
  KeyRound,
  Mail,
  Phone,
  FileSpreadsheet,
  Download,
  Eye,
  EyeOff,
} from "lucide-react";
import { formatPrice, formatRelativeTime } from "@/lib/utils";

export default function AdminDashboardPage() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [adminPhone, setAdminPhone] = useState("0111900328");
  const [adminPassword, setAdminPassword] = useState("admin123");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Dashboard state
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Stats & Data
  const [properties, setProperties] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    landlordsCount: 0,
    tenantsCount: 0,
    adminsCount: 0,
  });
  const [userFilter, setUserFilter] = useState<"ALL" | "LANDLORD" | "TENANT" | "ADMIN">("ALL");
  const [userSearch, setUserSearch] = useState("");

  // Appoint Admin Modal State
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPhone, setNewAdminPhone] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("Admin@123");
  const [addingAdminLoading, setAddingAdminLoading] = useState(false);
  const [addingAdminError, setAddingAdminError] = useState<string | null>(null);

  // Edit Admin Phone Modal State
  const [showEditPhoneModal, setShowEditPhoneModal] = useState(false);
  const [editPhoneValue, setEditPhoneValue] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Edit Admin Password Modal State
  const [showEditPasswordModal, setShowEditPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Settings State
  const [commissionEnabled, setCommissionEnabled] = useState(true);
  const [landlordPercent, setLandlordPercent] = useState(5.0);
  const [tenantPercent, setTenantPercent] = useState(5.0);
  const [bankakNumber, setBankakNumber] = useState("2345678");
  const [bankakName, setBankakName] = useState("منصة سكن العقارية");

  // Tab State
  const [activeTab, setActiveTab] = useState<"settings" | "properties" | "leads" | "reports" | "users">("users");

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    setLoadingAuth(true);
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.success && data.user && (data.user.role === "ADMIN" || data.user.role === "SUPER_ADMIN")) {
        setCurrentUser(data.user);
        fetchAdminData();
      } else {
        window.location.href = "/admin/login";
      }
    } catch (err) {
      window.location.href = "/admin/login";
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: adminPhone.trim(), password: adminPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "بيانات الدخول غير صحيحة");
      }

      if (data.user?.role !== "ADMIN" && data.user?.role !== "SUPER_ADMIN") {
        throw new Error("هذا الحساب ليس لديه صلاحيات إدارة المنصة");
      }

      setCurrentUser(data.user);
      fetchAdminData();
    } catch (err: any) {
      setLoginError(err.message || "فشل تسجيل دخول المشرف");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/admin/login";
    } catch (err) {
      window.location.href = "/admin/login";
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Settings
      const settingsRes = await fetch("/api/admin/settings");
      const settingsData = await settingsRes.json();
      if (settingsData.success && settingsData.settings) {
        setCommissionEnabled(settingsData.settings.commissionEnabled);
        setLandlordPercent(settingsData.settings.landlordCommissionPercent);
        setTenantPercent(settingsData.settings.tenantCommissionPercent);
        if (settingsData.settings.bankakAccountNumber) {
          setBankakNumber(settingsData.settings.bankakAccountNumber);
        }
        if (settingsData.settings.bankakAccountName) {
          setBankakName(settingsData.settings.bankakAccountName);
        }
      }

      // 2. Properties
      const propsRes = await fetch("/api/properties?status=ALL");
      const propsData = await propsRes.json();
      if (propsData.success) {
        setProperties(propsData.properties);
      }

      // 3. Leads
      const leadsRes = await fetch("/api/admin/leads");
      const leadsData = await leadsRes.json();
      if (leadsData.success) {
        setLeads(leadsData.leads);
      }

      // 4. Reports
      const reportsRes = await fetch("/api/admin/reports");
      const reportsData = await reportsRes.json();
      if (reportsData.success) {
        setReports(reportsData.reports);
      }

      // 5. Detailed Users Analytics
      const usersRes = await fetch("/api/admin/users");
      const usersData = await usersRes.json();
      if (usersData.success) {
        setUsers(usersData.users || []);
        if (usersData.stats) {
          setUserStats(usersData.stats);
        }
      }
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Instant Commission Toggle with Auto-Save
  const handleToggleCommissionInstant = async () => {
    const nextState = !commissionEnabled;
    setCommissionEnabled(nextState);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commissionEnabled: nextState,
          landlordCommissionPercent: Number(landlordPercent),
          tenantCommissionPercent: Number(tenantPercent),
          bankakAccountNumber: bankakNumber,
          bankakAccountName: bankakName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMessage(
          nextState
            ? "✅ تم تفعيل العمولة (5% مالك + 5% مستأجر) فوراً على كافة صفحات التطبيق!"
            : "🛑 تم إيقاف العمولة فوراً! المنصة تعمل الآن مجاناً 100% بدون أي عمولة."
        );
        setTimeout(() => setSaveMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSaveMessage(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commissionEnabled,
          landlordCommissionPercent: Number(landlordPercent),
          tenantCommissionPercent: Number(tenantPercent),
          bankakAccountNumber: bankakNumber,
          bankakAccountName: bankakName,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaveMessage("✅ تم حفظ وتطبيق إعدادات المنصة وبنكك بنجاح!");
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleUpdatePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(null);
    setPhoneLoading(true);

    try {
      const res = await fetch("/api/admin/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: editPhoneValue }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل تحديث رقم الهاتف");
      }

      setCurrentUser((prev: any) => ({ ...prev, phone: data.user.phone }));
      setShowEditPhoneModal(false);
      setSaveMessage("✓ تم تحديث رقم هاتف المشرف بنجاح!");
      setTimeout(() => setSaveMessage(null), 3500);
    } catch (err: any) {
      setPhoneError(err.message || "حدث خطأ أثناء حفظ رقم الهاتف");
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError("كلمة المرور يجب ألا تقل عن 6 أحرف أو أرقام");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("كلمتا المرور غير متطابقتين");
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await fetch("/api/admin/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword, confirmPassword: confirmNewPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل تغيير كلمة المرور");
      }

      setShowEditPasswordModal(false);
      setNewPassword("");
      setConfirmNewPassword("");
      setSaveMessage("✓ تم تغيير وتحديث كلمة مرور المشرف بنجاح!");
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err: any) {
      setPasswordError(err.message || "حدث خطأ أثناء تغيير كلمة المرور");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleExportUsersToExcel = () => {
    if (!users || users.length === 0) {
      alert("لا توجد بيانات مستخدمين لتصديرها حالياً");
      return;
    }

    try {
      // 1. Prepare clean, structured data rows for Excel
      const excelRows = users.map((u, idx) => {
        const typeLabel =
          u.role === "ADMIN" || u.role === "SUPER_ADMIN"
            ? "مشرف لوحة التحكم"
            : u.propertiesCount > 0
            ? "مؤجر ومعلن (مالك)"
            : "مستأجر (باحث عن سكن)";

        const cleanPhone = u.phone
          ? u.phone.startsWith("249")
            ? "0" + u.phone.slice(3)
            : u.phone
          : "غير مضاف";

        const dateStr = u.createdAt
          ? new Date(u.createdAt).toLocaleDateString("ar-EG", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })
          : "-";

        return {
          "الرقم": idx + 1,
          "اسم المستخدم": u.name || "مستخدم",
          "نوع الحساب": typeLabel,
          "رقم الهاتف": cleanPhone,
          "البريد الإلكتروني": u.email || "غير مضاف",
          "العقارات المعروضة": u.propertiesCount || 0,
          "طلبات المعاينة": u.leadsCount || 0,
          "تاريخ التسجيل": dateStr,
          "معرف الحساب (ID)": u.id,
        };
      });

      // 2. Generate worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelRows);

      // 3. Set Right-to-Left (RTL) mode for Arabic
      worksheet["!views"] = [{ rightToLeft: true }];

      // 4. Set tailored column widths
      worksheet["!cols"] = [
        { wch: 8 },  // الرقم
        { wch: 24 }, // اسم المستخدم
        { wch: 22 }, // نوع الحساب
        { wch: 18 }, // رقم الهاتف
        { wch: 28 }, // البريد الإلكتروني
        { wch: 18 }, // العقارات المعروضة
        { wch: 16 }, // طلبات المعاينة
        { wch: 16 }, // تاريخ التسجيل
        { wch: 28 }, // معرف الحساب
      ];

      // 5. Create workbook and add the sheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "مستخدمو منصة سكن");

      // 6. Download as real .xlsx Excel file
      const fileName = `سجل_مستخدمي_منصة_سكن_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      setSaveMessage("✅ تم تنزيل سجل المستخدمين بنجاح بصيغة Microsoft Excel (.xlsx) المنظمة!");
      setTimeout(() => setSaveMessage(null), 3500);
    } catch (err: any) {
      console.error("Excel export error:", err);
      alert("حدث خطأ أثناء تصدير ملف الإكسل");
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingAdminError(null);
    setAddingAdminLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAdminName.trim(),
          email: newAdminEmail.trim() || undefined,
          phone: newAdminPhone.trim() || undefined,
          password: newAdminPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل تعيين المشرف");
      }

      setSaveMessage(`✓ ${data.message}`);
      setTimeout(() => setSaveMessage(null), 3500);
      setShowAddAdminModal(false);
      setNewAdminName("");
      setNewAdminEmail("");
      setNewAdminPhone("");
      setNewAdminPassword("Admin@123");
      fetchAdminData();
    } catch (err: any) {
      setAddingAdminError(err.message || "حدث خطأ أثناء تعيين المشرف");
    } finally {
      setAddingAdminLoading(false);
    }
  };

  const handleToggleUserRole = async (userId: string, newRole: "ADMIN" | "USER", userName: string) => {
    const actionLabel = newRole === "ADMIN" ? "ترقية هذا الحساب إلى مدير للمنصة" : "إلغاء صفة المدير وتحويل الحساب إلى مستخدم عادي";
    if (!confirm(`هل أنت متأكد من ${actionLabel} لـ (${userName})؟`)) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "فشل تعديل الصلاحية");
        return;
      }

      setSaveMessage(`✓ ${data.message}`);
      setTimeout(() => setSaveMessage(null), 3500);
      fetchAdminData();
    } catch (err) {
      alert("حدث خطأ أثناء تعديل صلاحية الحساب");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/admin/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleBanPropertyFromReport = async (reportId: string, propertyId: string) => {
    if (!confirm("هل تريد بالتأكيد حظر هذا العقار وإغلاق البلاغ؟")) return;
    try {
      await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, status: "RESOLVED", action: "BAN_PROPERTY" }),
      });
      setSaveMessage("🚫 تم حظر العقار المبلغ عنه بنجاح وتم حل البلاغ!");
      setTimeout(() => setSaveMessage(null), 3500);
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDismissReport = async (reportId: string) => {
    try {
      await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, status: "DISMISSED" }),
      });
      setSaveMessage("✓ تم تجاهل البلاغ واعتباره غير صحيح.");
      setTimeout(() => setSaveMessage(null), 3000);
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا البلاغ من السجل؟")) return;
    try {
      await fetch(`/api/admin/reports?id=${reportId}`, { method: "DELETE" });
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case "FAKE_PHOTOS":
        return "الصور غير مطابقة للواقع ومضللة";
      case "ALREADY_RENTED":
        return "الشقة تم تأجيرها بالفعل ولا تزال معروضة";
      case "INCORRECT_PHONE":
        return "رقم الهاتف غير صحيح أو لا يرد";
      case "MISLEADING_PRICE":
        return "السعر غير حقيقي أو مختلف عن المعروض";
      case "INAPPROPRIATE_CONTENT":
        return "محتوى مخالف للشروط";
      default:
        return reason || "سبب آخر";
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا العقار نهائياً؟")) return;
    try {
      await fetch(`/api/admin/properties/${id}`, { method: "DELETE" });
      fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Loading screen
  if (loadingAuth) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-700" />
        <span className="text-xs font-bold">جاري التحقق من أمان المشرف...</span>
      </div>
    );
  }

  // 2. PROTECTED ADMIN LOGIN GATE (Hidden from normal users)
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto pt-6 pb-12">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
          <div className="text-center space-y-1">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
              <Lock className="w-7 h-7 text-emerald-400" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">بوابة إدارة منصة سَكَن</h1>
            <p className="text-xs text-slate-500 font-medium">
              هذه المنطقة مخصصة حصرياً لمشرفي وإدارة المنصة
            </p>
          </div>

          {loginError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-red-800 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم هاتف المشرف</label>
              <input
                type="tel"
                required
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-sm font-bold dir-ltr text-right focus:ring-2 focus:ring-brand-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">كلمة مرور الإدارة</label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-brand-700"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-2xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2 mt-2"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 text-emerald-400" />
                  دخول لوحة التحكم
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter((u) => {
    if (userFilter === "LANDLORD" && u.userType !== "LANDLORD") return false;
    if (userFilter === "TENANT" && u.userType !== "TENANT") return false;
    if (userFilter === "ADMIN" && u.userType !== "ADMIN") return false;
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase().trim();
      const nameMatch = u.name?.toLowerCase().includes(q);
      const emailMatch = u.email?.toLowerCase().includes(q);
      const phoneMatch = u.phone?.includes(q);
      return nameMatch || emailMatch || phoneMatch;
    }
    return true;
  });

  // 3. AUTHENTICATED ADMIN DASHBOARD
  return (
    <div className="space-y-6 pb-12">
      {/* Top Admin Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/90 p-1.5 flex items-center justify-center shadow-md">
            <Image src="/logo.png" alt="سكن SAKAN" width={38} height={38} className="w-full h-full object-contain" priority />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">لوحة تحكم المشرفين</h1>
            <p className="text-xs text-slate-500 font-medium">
              مرحباً بك، {currentUser.name} | إدارة العمولات والإعلانات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdminData}
            className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            تحديث
          </button>
          <button
            onClick={handleAdminLogout}
            className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition"
            title="تسجيل الخروج من الإدارة"
          >
            <LogOut className="w-4 h-4" />
            خروج
          </button>
        </div>
      </div>

      {/* Admin Profile & Credentials Management Bar */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/90 p-1.5 flex items-center justify-center shadow-md shrink-0">
            <Image src="/logo.png" alt="سكن SAKAN" width={38} height={38} className="w-full h-full object-contain" priority />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white">{currentUser.name}</span>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                المشرف الأساسي للمنصة ✓
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-[11px] text-slate-400 font-mono mt-0.5">
              <span>{currentUser.email || "admin@sakan.app"}</span>
              <span>•</span>
              <span className="text-emerald-400 dir-ltr font-bold">{currentUser.phone || "لا يوجد هاتف مسجل"}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Edit Phone & Edit Password */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditPhoneValue(currentUser.phone ? currentUser.phone.replace(/^249/, "0") : "");
              setPhoneError(null);
              setShowEditPhoneModal(true);
            }}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-emerald-400 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>تعديل رقم الهاتف</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setNewPassword("");
              setConfirmNewPassword("");
              setPasswordError(null);
              setShowEditPasswordModal(true);
            }}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md"
          >
            <KeyRound className="w-3.5 h-3.5 text-white" />
            <span>تعديل كلمة السر</span>
          </button>
        </div>
      </div>

      {/* User Demographics & Analytics Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-brand-800" />
            <span>إحصائيات المستخدمين بالتفصيل (معلنون ومؤجرون ومستأجرون)</span>
          </h2>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
            بيانات فورية من قاعدة البيانات ✓
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Total Users */}
          <div
            onClick={() => { setActiveTab("users"); setUserFilter("ALL"); }}
            className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm hover:border-brand-400 hover:shadow-md transition cursor-pointer"
          >
            <span className="text-[11px] font-bold text-slate-400 block mb-1">إجمالي المستخدمين</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-extrabold text-slate-900">{userStats.totalUsers}</span>
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <span className="text-[10px] text-slate-500 font-semibold block mt-1">كافة الحسابات المسجلة</span>
          </div>

          {/* Landlords / Advertisers */}
          <div
            onClick={() => { setActiveTab("users"); setUserFilter("LANDLORD"); }}
            className="bg-white p-4 rounded-3xl border border-emerald-200 shadow-sm hover:border-emerald-400 hover:shadow-md transition cursor-pointer bg-gradient-to-bl from-emerald-50/40 to-white"
          >
            <span className="text-[11px] font-bold text-emerald-800 block mb-1">المعلنون والمؤجرون (الملاك)</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-extrabold text-emerald-700">{userStats.landlordsCount}</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <span className="text-[10px] text-emerald-700 font-bold block mt-1">ناشرو الشقق المؤجرة</span>
          </div>

          {/* Tenants / Seekers */}
          <div
            onClick={() => { setActiveTab("users"); setUserFilter("TENANT"); }}
            className="bg-white p-4 rounded-3xl border border-blue-200 shadow-sm hover:border-blue-400 hover:shadow-md transition cursor-pointer bg-gradient-to-bl from-blue-50/40 to-white"
          >
            <span className="text-[11px] font-bold text-blue-800 block mb-1">المستأجرون والباحثون</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-extrabold text-blue-700">{userStats.tenantsCount}</span>
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
            </div>
            <span className="text-[10px] text-blue-700 font-bold block mt-1">المتواصلون لطلب السكن</span>
          </div>

          {/* Admins */}
          <div
            onClick={() => { setActiveTab("users"); setUserFilter("ADMIN"); }}
            className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm hover:border-slate-400 hover:shadow-md transition cursor-pointer"
          >
            <span className="text-[11px] font-bold text-slate-500 block mb-1">المشرفون والإدارة</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-extrabold text-slate-800">{userStats.adminsCount}</span>
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
            </div>
            <span className="text-[10px] text-slate-500 font-semibold block mt-1">أصحاب صلاحية التحكم</span>
          </div>
        </div>
      </div>

      {/* Platform & Property Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">إجمالي العقارات</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-slate-900">{properties.length}</span>
            <Home className="w-5 h-5 text-brand-700" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">شقق نشطة ومتاحة</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-emerald-600">
              {properties.filter((p) => p.status === "ACTIVE").length}
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">سجل نقرات الاتصال</span>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-extrabold text-brand-800">{leads.length}</span>
            <PhoneCall className="w-5 h-5 text-brand-800" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 block mb-1">حالة العمولة العامة</span>
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-extrabold px-2.5 py-1 rounded-lg ${
                commissionEnabled ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
              }`}
            >
              {commissionEnabled ? "مفعلة (5%+5%)" : "معطلة (مجاني 100%)"}
            </span>
            <Power className={`w-5 h-5 ${commissionEnabled ? "text-emerald-600" : "text-red-500"}`} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === "users"
              ? "bg-brand-800 text-white shadow"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Users className="w-4 h-4" />
          المستخدمين ({users.length})
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === "settings"
              ? "bg-brand-800 text-white shadow"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Sliders className="w-4 h-4" />
          محرك العمولة (Switch)
        </button>

        <button
          onClick={() => setActiveTab("properties")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === "properties"
              ? "bg-brand-800 text-white shadow"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Home className="w-4 h-4" />
          العقارات ({properties.length})
        </button>

        <button
          onClick={() => setActiveTab("leads")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === "leads"
              ? "bg-brand-800 text-white shadow"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          سجل الاتصالات ({leads.length})
        </button>

        <button
          onClick={() => setActiveTab("reports")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
            activeTab === "reports"
              ? "bg-brand-800 text-white shadow"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          البلاغات ({reports.length})
        </button>
      </div>

      {/* TAB 1: COMMISSION SWITCH & SETTINGS */}
      {activeTab === "settings" && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
          {saveMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{saveMessage}</span>
            </div>
          )}

          {/* Master Commission Toggle with Instant Auto-Save */}
          <div className="p-5 rounded-2xl border-2 transition flex items-center justify-between gap-4 bg-slate-50 border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Power className={`w-5 h-5 ${commissionEnabled ? "text-emerald-600" : "text-slate-400"}`} />
                <h3 className="font-extrabold text-sm text-slate-900">
                  المفتاح العام لتشغيل / إيقاف العمولة (تطبيق فوري)
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {commissionEnabled
                  ? "العمولة مفعلة حالياً: يلزم التطبيق المالك والمستأجر بتعهد الـ 5%."
                  : "العمولة متوقفة تماماً: المنصة تعمل مجاناً 100% بدون أي رسوم."}
              </p>
            </div>

            {/* Instant Toggle Button */}
            <button
              type="button"
              onClick={handleToggleCommissionInstant}
              className={`w-16 h-9 rounded-full transition-colors p-1 flex items-center shadow-inner shrink-0 ${
                commissionEnabled ? "bg-emerald-600 justify-start" : "bg-slate-300 justify-end"
              }`}
              title="انقر لتشغيل أو إيقاف العمولة فوراً"
            >
              <div className="w-7 h-7 rounded-full bg-white shadow-md transform transition-transform"></div>
            </button>
          </div>

          {/* Commission Percentages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">نسبة عمولة المالك (%):</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  disabled={!commissionEnabled}
                  value={landlordPercent}
                  onChange={(e) => setLandlordPercent(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-extrabold text-brand-900 focus:ring-2 focus:ring-brand-700 disabled:opacity-50"
                />
                <Percent className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">نسبة عمولة المستأجر (%):</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  disabled={!commissionEnabled}
                  value={tenantPercent}
                  onChange={(e) => setTenantPercent(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 p-3 rounded-xl text-sm font-extrabold text-brand-900 focus:ring-2 focus:ring-brand-700 disabled:opacity-50"
                />
                <Percent className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Bankak Details */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-800">بيانات تحصيل العمولة عبر تطبيق بنكك:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">رقم حساب بنكك:</label>
                <input
                  type="text"
                  value={bankakNumber}
                  onChange={(e) => setBankakNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold dir-ltr text-right"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">اسم صاحب الحساب:</label>
                <input
                  type="text"
                  value={bankakName}
                  onChange={(e) => setBankakName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="flex items-center gap-2 bg-brand-800 hover:bg-brand-700 active:scale-95 text-white px-6 py-3 rounded-2xl text-xs font-bold shadow-md transition"
            >
              {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              حفظ الإعدادات والنسب
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: PROPERTIES */}
      {activeTab === "properties" && (
        <div className="space-y-3">
          {properties.length === 0 ? (
            <div className="p-8 bg-white rounded-3xl text-center text-slate-400 text-xs">لا توجد عقارات مضافة</div>
          ) : (
            properties.map((p) => (
              <div
                key={p.id}
                className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                    <img
                      src={p.images[0]?.url || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80"}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm truncate">{p.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
                      <span>{p.city}</span>
                      <span>•</span>
                      <span className="font-bold text-brand-800">{formatPrice(p.price, p.currency)}</span>
                      <span>•</span>
                      <span className="dir-ltr">{p.contactPhone}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          p.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : p.status === "BANNED"
                            ? "bg-red-100 text-red-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {p.status === "ACTIVE" ? "نشط ومتاح" : p.status === "BANNED" ? "محظور" : "مؤجر"}
                      </span>
                      <span className="text-[10px] text-brand-800 font-semibold bg-brand-50 px-2 py-0.5 rounded-md">
                        {p.leadsCount || 0} نقرات اتصال
                      </span>
                    </div>
                  </div>
                </div>

                {/* Moderation Actions */}
                <div className="flex items-center gap-2 border-t md:border-t-0 pt-2 md:pt-0">
                  {p.status !== "ACTIVE" && (
                    <button
                      onClick={() => handleUpdateStatus(p.id, "ACTIVE")}
                      className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition"
                    >
                      تفعيل (Active)
                    </button>
                  )}

                  {p.status !== "BANNED" && (
                    <button
                      onClick={() => handleUpdateStatus(p.id, "BANNED")}
                      className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl transition flex items-center gap-1"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      حظر
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteProperty(p.id)}
                    className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    حذف
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: LEADS TRACKER */}
      {activeTab === "leads" && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">سجل نقرات الاتصال والواتساب للمستأجرين</h3>
              <p className="text-[11px] text-slate-500">تفاصيل المستأجر والمالك والعقار لتسهيل المتابعة وتأكيد الحجوزات وتحصيل العمولات</p>
            </div>
            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-xl">
              إجمالي العمليات: {leads.length}
            </span>
          </div>

          {leads.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">لا توجد عمليات اتصال مسجلة بعد</div>
          ) : (
            <div className="space-y-4">
              {leads.map((lead: any) => {
                const tenantName = lead.viewer?.name || "مستأجر عبر المنصة";
                const tenantPhone = lead.viewer?.phone || lead.viewerPhone || "غير مسجل";
                const tenantEmail = lead.viewer?.email;
                const landlordName = lead.property?.landlord?.name || "مالك العقار";
                const landlordPhone = lead.property?.contactPhone || lead.property?.landlord?.phone || "غير مسجل";
                const landlordWhatsapp = lead.property?.whatsappNumber || landlordPhone;
                const isWhatsapp = lead.type === "WHATSAPP";
                const expectedCommission = lead.property?.price ? Math.round(lead.property.price * 0.05) : 0;

                return (
                  <div
                    key={lead.id}
                    className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 transition shadow-sm space-y-3.5"
                  >
                    {/* Top row: Property info, Type badge, and Relative Time */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isWhatsapp
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {isWhatsapp ? <MessageSquare className="w-4 h-4" /> : <PhoneCall className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                              {lead.property?.title || "عقار"}
                            </span>
                            {lead.property?.id && (
                              <a
                                href={`/properties/${lead.property.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-400 hover:text-brand-800 transition shrink-0"
                                title="معاينة إعلان الشقة في تبويب جديد"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {lead.property?.city} {lead.property?.district ? `• ${lead.property.district}` : ""}
                            {lead.property?.price && ` • ${formatPrice(lead.property.price, lead.property.currency)}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                            isWhatsapp
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {isWhatsapp ? "مراسلة واتساب" : "اتصال هاتفي مباشر"}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium bg-slate-50 px-2.5 py-1 rounded-lg">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {formatRelativeTime(lead.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Middle grid: Tenant vs Landlord side-by-side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      {/* Tenant Box (المستأجر) */}
                      <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100/90 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-blue-700" />
                            بيانات المستأجر (طالب الحجز):
                          </span>
                          <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-md">
                            المتصل
                          </span>
                        </div>

                        <div className="text-xs space-y-1">
                          <div className="font-extrabold text-slate-900">{tenantName}</div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-600">
                            <span className="text-slate-400">رقم الهاتف:</span>
                            <span className="font-mono font-bold text-slate-800 dir-ltr inline-block">
                              {tenantPhone}
                            </span>
                          </div>
                          {tenantEmail && (
                            <div className="text-[10px] text-slate-500 font-mono truncate">
                              {tenantEmail}
                            </div>
                          )}
                        </div>

                        {/* Quick Tenant Actions */}
                        {tenantPhone && tenantPhone !== "غير مسجل" && (
                          <div className="flex items-center gap-1.5 pt-1.5 border-t border-blue-100">
                            <a
                              href={`tel:${tenantPhone.replace(/[^0-9]/g, "")}`}
                              className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition"
                            >
                              <PhoneCall className="w-3 h-3" />
                              اتصال بالمستأجر
                            </a>
                            <a
                              href={`https://wa.me/${tenantPhone.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition"
                              title="محادثة واتساب مع المستأجر"
                            >
                              <MessageSquare className="w-3 h-3" />
                              واتساب
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Landlord Box (المالك) */}
                      <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100/90 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-emerald-950 flex items-center gap-1.5">
                            <Home className="w-3.5 h-3.5 text-emerald-700" />
                            بيانات المالك (صاحب الشقة):
                          </span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                            المؤجر
                          </span>
                        </div>

                        <div className="text-xs space-y-1">
                          <div className="font-extrabold text-slate-900">{landlordName}</div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-600">
                            <span className="text-slate-400">رقم الهاتف:</span>
                            <span className="font-mono font-bold text-slate-800 dir-ltr inline-block">
                              {landlordPhone}
                            </span>
                          </div>
                          {lead.property?.whatsappNumber && (
                            <div className="flex items-center gap-2 text-[11px] text-slate-600">
                              <span className="text-slate-400">الواتساب:</span>
                              <span className="font-mono font-bold text-slate-800 dir-ltr inline-block">
                                {lead.property.whatsappNumber}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Quick Landlord Actions */}
                        {landlordPhone && landlordPhone !== "غير مسجل" && (
                          <div className="flex items-center gap-1.5 pt-1.5 border-t border-emerald-100">
                            <a
                              href={`tel:${landlordPhone.replace(/[^0-9]/g, "")}`}
                              className="flex-1 py-1.5 px-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition"
                            >
                              <PhoneCall className="w-3 h-3" />
                              اتصال بالمالك
                            </a>
                            <a
                              href={`https://wa.me/${landlordWhatsapp.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition"
                              title="محادثة واتساب مع المالك"
                            >
                              <MessageSquare className="w-3 h-3" />
                              واتساب
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom strip: Estimated commission note */}
                    {expectedCommission > 0 && (
                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="font-medium">العمولة المقدرة للمنصة (5% مالك + 5% مستأجر):</span>
                        <span className="font-black text-emerald-800 dir-ltr">
                          {formatPrice(expectedCommission * 2, lead.property?.currency || "SDG")}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: REPORTS */}
      {activeTab === "reports" && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">بلاغات المستخدمين عن العقارات</h3>
              <p className="text-[11px] text-slate-500">راجع الشكاوى واتخذ الإجراء المناسب (حظر الإعلان المخالف، التحقق من المالك، أو تجاهل البلاغ)</p>
            </div>
            <span className="text-xs font-bold bg-red-50 text-red-700 px-3 py-1 rounded-xl">
              {reports.filter((r) => r.status === "PENDING").length} بلاغات قيد المراجعة
            </span>
          </div>

          {reports.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">لا توجد بلاغات مسجلة حالياً، المنصة نظيفة ✓</div>
          ) : (
            <div className="space-y-3">
              {reports.map((rep: any) => {
                const isPending = rep.status === "PENDING";
                const isResolved = rep.status === "RESOLVED";
                const isPropertyBanned = rep.property?.status === "BANNED";

                return (
                  <div
                    key={rep.id}
                    className={`p-4 rounded-2xl border transition space-y-3 ${
                      isPending ? "bg-red-50/30 border-red-200" : "bg-slate-50 border-slate-200 opacity-80"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                        <span className="text-xs font-extrabold text-red-700">
                          {getReasonLabel(rep.reason)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg ${
                            isPending
                              ? "bg-amber-100 text-amber-900"
                              : isResolved
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {isPending ? "قيد المراجعة" : isResolved ? "تمت المعالجة وحظر العقار" : "تم التجاهل"}
                        </span>
                        {isPropertyBanned && (
                          <span className="text-[10px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-lg">
                            العقار محظور حالياً
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {formatRelativeTime(rep.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Property info */}
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-2 text-slate-800">
                        <span className="text-slate-500 font-semibold">العقار المبلغ عنه:</span>
                        <span className="font-bold">{rep.property?.title || "عقار محذوف"}</span>
                        {rep.property?.city && (
                          <span className="text-slate-400 text-[11px]">({rep.property.city})</span>
                        )}
                      </div>

                      {rep.property?.contactPhone && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <span className="text-slate-500 font-semibold">رقم المالك:</span>
                          <span className="dir-ltr font-bold text-brand-800">{rep.property.contactPhone}</span>
                          <a
                            href={`tel:${rep.property.contactPhone}`}
                            className="text-[11px] font-bold text-brand-700 hover:underline mr-1"
                          >
                            اتصال هاتفي بالمالك
                          </a>
                        </div>
                      )}

                      {rep.details && (
                        <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 mt-1">
                          <span className="font-bold text-slate-700">ملاحظة المبلغ: </span>
                          {rep.details}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons for Admin */}
                    <div className="flex items-center flex-wrap gap-2 pt-2 border-t border-slate-200/60">
                      {/* View Property */}
                      {rep.property?.id && (
                        <a
                          href={`/properties/${rep.property.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition shadow-sm"
                        >
                          <Home className="w-3.5 h-3.5 text-brand-700" />
                          معاينة العقار في المتصفح
                        </a>
                      )}

                      {/* Ban Property */}
                      {isPending && !isPropertyBanned && rep.property?.id && (
                        <button
                          onClick={() => handleBanPropertyFromReport(rep.id, rep.property.id)}
                          className="flex items-center gap-1 text-[11px] font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 px-3 py-1.5 rounded-xl transition shadow-sm"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          حظر العقار فوراً وحل البلاغ
                        </button>
                      )}

                      {/* Dismiss Report */}
                      {isPending && (
                        <button
                          onClick={() => handleDismissReport(rep.id)}
                          className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                          تجاهل البلاغ (غير صحيح)
                        </button>
                      )}

                      {/* Delete Report record */}
                      <button
                        onClick={() => handleDeleteReport(rep.id)}
                        className="text-[11px] font-bold text-slate-400 hover:text-red-600 px-2 py-1.5 rounded-xl transition mr-auto"
                        title="حذف البلاغ من السجل"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: USERS DIRECTORY & BREAKDOWN */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Detailed Statistics Breakdown Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm">
              <div className="flex items-center gap-2 mb-1 text-slate-400">
                <Users className="w-4 h-4" />
                <span className="text-[11px] font-bold">إجمالي المستخدمين</span>
              </div>
              <span className="text-2xl font-extrabold text-slate-900">{userStats.totalUsers}</span>
              <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">مسجل في المنصة</span>
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-3xl border border-emerald-200/90 shadow-sm">
              <div className="flex items-center gap-2 mb-1 text-emerald-800">
                <Building2 className="w-4 h-4" />
                <span className="text-[11px] font-bold">المعلنون والمؤجرون (الملاك)</span>
              </div>
              <span className="text-2xl font-extrabold text-emerald-800">{userStats.landlordsCount}</span>
              <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">ناشرو الشقق المؤجرة</span>
            </div>

            <div className="bg-blue-50/70 p-4 rounded-3xl border border-blue-200/90 shadow-sm">
              <div className="flex items-center gap-2 mb-1 text-blue-800">
                <KeyRound className="w-4 h-4" />
                <span className="text-[11px] font-bold">المستأجرون والباحثون</span>
              </div>
              <span className="text-2xl font-extrabold text-blue-800">{userStats.tenantsCount}</span>
              <span className="text-[10px] text-blue-700 font-semibold block mt-0.5">المتواصلون لطلب السكن</span>
            </div>

            <div className="bg-slate-900 text-white p-4 rounded-3xl border border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 mb-1 text-emerald-400">
                <Shield className="w-4 h-4" />
                <span className="text-[11px] font-bold">المشرفون والإدارة</span>
              </div>
              <span className="text-2xl font-extrabold text-emerald-400">{userStats.adminsCount}</span>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">صلاحيات التحكم الكاملة</span>
            </div>
          </div>

          {/* Excel Export & Management Panel */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shadow-sm shrink-0">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">سجل بيانات المستخدمين المصدّر</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    تم إخفاء بطاقات المستخدمين لسرية وخصوصية البيانات، ومتاح تصديرها بالكامل كملف Excel متوافق.
                  </p>
                </div>
              </div>

              {/* Big Excel Export Button */}
              <button
                type="button"
                onClick={handleExportUsersToExcel}
                className="flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white px-5 py-3 rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>تنزيل وتصدير Excel .xlsx</span>
              </button>
            </div>

            {/* Breakdown Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 block">المعلنون وأصحاب العقارات</span>
                <span className="text-lg font-extrabold text-emerald-800">{userStats.landlordsCount} معلن ومؤجر</span>
                <span className="text-[10px] text-slate-400 block">يتضمن أرقام هواتفهم وإعلاناتهم في ملف الإكسل</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 block">المستأجرون والباحثون عن سكن</span>
                <span className="text-lg font-extrabold text-blue-800">{userStats.tenantsCount} مستأجر</span>
                <span className="text-[10px] text-slate-400 block">يتضمن بيانات التواصل وتاريخ التسجيل في ملف الإكسل</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 block">مشرفو المنصة المعتمدون</span>
                <span className="text-lg font-extrabold text-slate-900">{userStats.adminsCount} مشرف</span>
                <span className="text-[10px] text-slate-400 block">حساب الإدارة المعتمد فقط</span>
              </div>
            </div>

            {/* Appoint admin button (independent creation) */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 font-medium">
                هل ترغب في تعيين مدير جديد ؟
              </span>
              <button
                type="button"
                onClick={() => setShowAddAdminModal(true)}
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-emerald-400 border border-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm shrink-0"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>+ إنشاء وتعيين مدير جديد</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: APPOINT / CREATE NEW ADMIN */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white border border-slate-800 w-full max-w-md p-6 rounded-3xl shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">إضافة وتعيين مدير جديد</h3>
                  <span className="text-[11px] text-slate-400 font-medium">منح صلاحيات الإشراف على منصة سَكَن</span>
                </div>
              </div>
              <button
                onClick={() => setShowAddAdminModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {addingAdminError && (
              <div className="p-3 bg-red-950/80 border border-red-800 rounded-2xl flex items-center gap-2 text-red-200 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{addingAdminError}</span>
              </div>
            )}

            <form onSubmit={handleAddAdmin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">اسم المدير بالكامل *</label>
                <input
                  type="text"
                  required
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="مثال: أحمد عبد الله"
                  className="w-full bg-slate-800 border border-slate-700 py-2.5 px-3 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">البريد الإلكتروني للمدير (اختياري)</label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin2@sakan.app"
                  className="w-full bg-slate-800 border border-slate-700 py-2.5 px-3 rounded-xl text-xs font-semibold text-white dir-ltr text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">رقم هاتف المدير (اختياري)</label>
                <input
                  type="tel"
                  value={newAdminPhone}
                  onChange={(e) => setNewAdminPhone(e.target.value)}
                  placeholder="0912345678 أو 249..."
                  className="w-full bg-slate-800 border border-slate-700 py-2.5 px-3 rounded-xl text-xs font-semibold text-white dir-ltr text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">كلمة مرور لوحة الإدارة *</label>
                <input
                  type="text"
                  required
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 py-2.5 px-3 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={addingAdminLoading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {addingAdminLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري التعيين...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-3.5 h-3.5" />
                      <span>تأكيد تعيين المدير</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT ADMIN PHONE */}
      {showEditPhoneModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white border border-slate-800 w-full max-w-md p-6 rounded-3xl shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">تعديل رقم هاتف المشرف</h3>
                  <span className="text-[11px] text-slate-400 font-medium">لتسجيل الدخول والتواصل واستقبال الإشعارات</span>
                </div>
              </div>
              <button
                onClick={() => setShowEditPhoneModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {phoneError && (
              <div className="p-3 bg-red-950/80 border border-red-800 rounded-2xl flex items-center gap-2 text-red-200 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{phoneError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePhone} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  رقم الهاتف الجديد (السودان +249)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={editPhoneValue}
                    onChange={(e) => setEditPhoneValue(e.target.value)}
                    placeholder="مثال: 0111900328 أو 0912345678"
                    className="w-full bg-slate-800 border border-slate-700 py-3 px-4 rounded-xl text-sm font-bold text-white dir-ltr text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  يمكنك إدخال الرقم بصيغة 0111900328 أو 249... وسيتم حفظه فوراً
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditPhoneModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={phoneLoading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {phoneLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <span>حفظ رقم الهاتف</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT ADMIN PASSWORD */}
      {showEditPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white border border-slate-800 w-full max-w-md p-6 rounded-3xl shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">تعديل كلمة مرور المشرف</h3>
                  <span className="text-[11px] text-slate-400 font-medium">تغيير كلمة السر للدخول إلى لوحة التحكم</span>
                </div>
              </div>
              <button
                onClick={() => setShowEditPasswordModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {passwordError && (
              <div className="p-3 bg-red-950/80 border border-red-800 rounded-2xl flex items-center gap-2 text-red-200 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  كلمة المرور الجديدة *
                </label>
                <div className="relative">
                  <input
                    type={showPasswordText ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="6 أحرف أو أرقام على الأقل"
                    className="w-full bg-slate-800 border border-slate-700 py-2.5 pr-3 pl-10 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  تأكيد كلمة المرور الجديدة *
                </label>
                <input
                  type={showPasswordText ? "text" : "password"}
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="أعد كتابة كلمة المرور الجديدة"
                  className="w-full bg-slate-800 border border-slate-700 py-2.5 px-3 rounded-xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditPasswordModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {passwordLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري التغيير...</span>
                    </>
                  ) : (
                    <span>تأكيد تغيير كلمة المرور</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
