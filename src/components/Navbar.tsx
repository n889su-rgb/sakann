"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, User, Shield, LogIn, Heart } from "lucide-react";
import { useFavorites } from "@/lib/favorites";

export function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; role: string; avatarUrl?: string | null } | null>(null);
  const { count: favCount, mounted: favMounted } = useFavorites();
  const displayFavCount = favMounted ? favCount : 0;

  useEffect(() => {
    // Check auth status quietly
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
  }, [pathname]);

  // Navigation items: Guests see only "تصفح", logged-in users see "المفضلة", "أضف عقار", and "حسابي"
  const navItems = user
    ? [
        { label: "تصفح", href: "/", icon: Home },
        { label: "المفضلة", href: "/favorites", icon: Heart },
        { label: "أضف عقار", href: "/properties/new", icon: PlusCircle },
        { label: "حسابي", href: "/profile", icon: User },
      ]
    : [{ label: "تصفح", href: "/", icon: Home }];

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  // Dedicated clean header for Admin Login (No "تصفح" and No "دخول / تسجيل")
  if (pathname === "/admin/login") {
    return (
      <header className="sticky top-0 z-40 w-full glass-header border-b border-slate-200/80 px-4 py-3" suppressHydrationWarning>
        <div className="max-w-5xl mx-auto flex items-center justify-between" suppressHydrationWarning>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/90 p-1 flex items-center justify-center shadow-sm">
              <Image src="/logo.png" alt="سكن SAKAN" width={36} height={36} className="w-full h-full object-contain" priority />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 block leading-tight">
                سَكَن <span className="text-xs font-semibold text-emerald-700 uppercase tracking-widest mr-1">SAKAN</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium block">بوابة إدارة المنصة المخصصة</span>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
            نظام المشرفين فقط 🛡️
          </span>
        </div>
      </header>
    );
  }

  return (
    <>
      {/* Top Header - Desktop & Mobile */}
      <header className="sticky top-0 z-40 w-full glass-header border-b border-slate-200/80 px-4 py-3" suppressHydrationWarning>
        <div className="max-w-5xl mx-auto flex items-center justify-between" suppressHydrationWarning>
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/90 p-1 flex items-center justify-center shadow-sm group-hover:border-brand-700 transition">
              <Image src="/logo.png" alt="سكن SAKAN" width={36} height={36} className="w-full h-full object-contain" priority />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-brand-900 block leading-tight">
                سَكَن <span className="text-xs font-semibold text-brand-700 uppercase tracking-widest mr-1">SAKAN</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium block">شقق مفروشة جاهزة للإيجار</span>
            </div>
          </Link>

          {/* Desktop Navigation - Hidden on Admin portal */}
          {!pathname.startsWith("/admin") && (
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const isFavItem = item.href === "/favorites";

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition ${
                      isActive
                        ? "bg-brand-50 text-brand-800"
                        : "text-slate-600 hover:text-brand-800 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isFavItem && displayFavCount > 0 ? "fill-red-500 text-red-500" : ""}`} />
                    <span>{item.label}</span>
                    {isFavItem && displayFavCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                        {displayFavCount}
                      </span>
                    )}
                  </Link>
                );
              })}

              {/* Discreet Admin Link ONLY for authorized Admins */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                    pathname.startsWith("/admin")
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                  }`}
                  title="لوحة تحكم المشرفين فقط"
                >
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  لوحة الإدارة
                </Link>
              )}
            </nav>
          )}

          {/* User actions - Hidden on Admin portal */}
          {!pathname.startsWith("/admin") && (
            <div className="flex items-center gap-2">
              {/* Quick Favorites Button in Header (Logged-in members only) */}
              {user && (
                <Link
                  href="/favorites"
                  className={`relative p-2 rounded-xl border transition ${
                    pathname === "/favorites"
                      ? "bg-red-50 text-red-600 border-red-200"
                      : "bg-white text-slate-700 hover:text-red-500 border-slate-200 hover:bg-slate-50"
                  }`}
                  title="الإعلانات المفضلة"
                  aria-label="المفضلة"
                >
                  <Heart className={`w-4 h-4 ${displayFavCount > 0 ? "fill-red-500 text-red-500" : ""}`} />
                  {displayFavCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                      {displayFavCount}
                    </span>
                  )}
                </Link>
              )}

              {!user ? (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-brand-800 bg-white border border-slate-200 hover:bg-slate-50 px-3.5 py-2 rounded-xl transition shadow-sm"
                >
                  <LogIn className="w-4 h-4 text-brand-800" />
                  دخول / تسجيل
                </Link>
              ) : (
                <>
                  <Link
                    href="/profile"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-800 bg-brand-50 border border-brand-200 px-2.5 py-1.5 rounded-xl transition"
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-4 h-4 rounded-full object-cover border border-brand-300"
                      />
                    ) : (
                      <User className="w-3.5 h-3.5" />
                    )}
                    <span>{user.name.split(" ")[0]}</span>
                  </Link>

                  <Link
                    href="/properties/new"
                    className="hidden md:inline-flex items-center gap-1.5 bg-brand-800 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition"
                  >
                    <PlusCircle className="w-4 h-4" />
                    أضف عقارك
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar - Hidden on Admin */}
      {!pathname.startsWith("/admin") && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-3 shadow-lg" suppressHydrationWarning>
          <div className="flex items-center justify-around max-w-md mx-auto" suppressHydrationWarning>
            {/* For Guests: Login tab */}
            {!user && (
              <Link
                href="/login"
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition ${
                  pathname === "/login" || pathname === "/register"
                    ? "text-brand-800 font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <LogIn className="w-5 h-5 stroke-2" />
                <span className="text-[11px]">دخول / تسجيل</span>
              </Link>
            )}

            {[...navItems].reverse().map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const isFavItem = item.href === "/favorites";

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition ${
                    isActive ? "text-brand-800 font-bold" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-2"} ${isFavItem && displayFavCount > 0 ? "fill-red-500 text-red-500" : ""}`} />
                  <span className="text-[11px]">{item.label}</span>
                  {isFavItem && displayFavCount > 0 && (
                    <span className="absolute -top-1 right-2 bg-red-500 text-white text-[9px] font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                      {displayFavCount}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Admin tab appears ONLY if the logged in user is actually an ADMIN */}
            {isAdmin && (
              <Link
                href="/admin"
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition ${
                  pathname.startsWith("/admin") ? "text-emerald-700 font-bold" : "text-slate-400"
                }`}
              >
                <Shield className="w-5 h-5" />
                <span className="text-[10px]">إدارة</span>
              </Link>
            )}
          </div>
        </nav>
      )}
    </>
  );
}
