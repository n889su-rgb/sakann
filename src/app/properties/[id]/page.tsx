import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatPrice } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import PropertyDetailClient from "./PropertyDetailClient";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const property = await prisma.property.findUnique({
    where: { id: params.id },
  });

  if (!property) return { title: "العقار غير موجود | سكن" };

  return {
    title: `${property.title} | سكن`,
    description: property.description.slice(0, 160),
  };
}

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  const property = await prisma.property.findUnique({
    where: { id: params.id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      amenities: { include: { amenity: true } },
      landlord: true,
    },
  });

  if (!property) {
    notFound();
  }

  // Check if visitor is logged in or guest
  const user = await getCurrentUser();
  const isGuest = !user;
  const isOwner = Boolean(user && (user.id === property.landlordId || user.role === "ADMIN" || user.role === "SUPER_ADMIN"));

  // Mask landlord data if visitor is a guest
  const sanitizedProperty = isGuest
    ? {
        ...property,
        contactPhone: "مخفي للضيوف",
        whatsappNumber: null,
        landlord: property.landlord
          ? {
              ...property.landlord,
              name: "صاحب العقار",
              phone: "مخفي للضيوف",
            }
          : null,
      }
    : property;

  // Fetch settings for commission display
  const settings = await prisma.systemSetting.findUnique({
    where: { id: "singleton" },
  });

  return (
    <div className="max-w-2xl mx-auto pb-12">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
        <Link
          href="/"
          className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>
        <span className="text-sm font-bold text-slate-700">تفاصيل الشقة المفروشة</span>
        <div className="w-10"></div>
      </div>

      <PropertyDetailClient
        property={sanitizedProperty}
        commissionEnabled={settings?.commissionEnabled ?? true}
        tenantCommissionPercent={settings?.tenantCommissionPercent ?? 5.0}
        isGuest={isGuest}
        isOwner={isOwner}
      />
    </div>
  );
}
