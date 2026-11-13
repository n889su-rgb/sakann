import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { stripHtmlTags } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

// GET: Fetch property details for editing
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "يجب تسجيل الدخول أولاً" },
        { status: 401 }
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: params.id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        amenities: { include: { amenity: true } },
      },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, error: "العقار غير موجود" },
        { status: 404 }
      );
    }

    const isOwner = property.landlordId === user.id || user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: "غير مصرح لك بالوصول لتعديل هذا العقار" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, property });
  } catch (error: any) {
    console.error("GET Property For Edit Error:", error);
    return NextResponse.json(
      { success: false, error: "فشل جلب بيانات العقار" },
      { status: 500 }
    );
  }
}

// PUT: Update property details (Only landlord or admin)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "يجب تسجيل الدخول لتعديل العقار" },
        { status: 401 }
      );
    }

    const existingProperty = await prisma.property.findUnique({
      where: { id: params.id },
    });

    if (!existingProperty) {
      return NextResponse.json(
        { success: false, error: "العقار غير موجود" },
        { status: 404 }
      );
    }

    // Ownership check: only landlord who created the listing or platform admins can edit
    const isOwner = existingProperty.landlordId === user.id || user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: "غير مصرح لك بتعديل هذا الإعلان" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      city,
      district,
      price,
      currency,
      bedrooms,
      bathrooms,
      contactPhone,
      whatsappNumber,
      images,
      amenities,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "عنوان الإعلان مطلوب" },
        { status: 400 }
      );
    }

    if (!price || parseFloat(price) <= 0) {
      return NextResponse.json(
        { success: false, error: "يرجى تحديد سعر الإيجار بشكل صحيح" },
        { status: 400 }
      );
    }

    if (!contactPhone || !contactPhone.trim()) {
      return NextResponse.json(
        { success: false, error: "رقم هاتف التواصل مطلوب" },
        { status: 400 }
      );
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { success: false, error: "يرجى إبقاء أو رفع صورة واحدة على الأقل للشقة" },
        { status: 400 }
      );
    }

    // Sanitize user inputs to prevent XSS
    const safeTitle = stripHtmlTags(title.trim());
    const safeDescription = stripHtmlTags((description || "").trim());
    const safeCity = stripHtmlTags(city.trim());
    const safeDistrict = district ? stripHtmlTags(district.trim()) : null;

    // 1. Update basic property fields
    const updatedProperty = await prisma.property.update({
      where: { id: params.id },
      data: {
        title: safeTitle,
        description: safeDescription,
        city: safeCity,
        district: safeDistrict,
        price: parseFloat(price),
        currency: currency === "USD" ? "USD" : "SDG",
        bedrooms: parseInt(bedrooms, 10) || 0,
        bathrooms: parseInt(bathrooms, 10) || 0,
        contactPhone: contactPhone.trim(),
        whatsappNumber: whatsappNumber ? whatsappNumber.trim() : contactPhone.trim(),
      },
    });

    // 2. Synchronize images: delete existing and insert updated list
    await prisma.propertyImage.deleteMany({
      where: { propertyId: params.id },
    });

    await prisma.propertyImage.createMany({
      data: images.map((url: string, idx: number) => ({
        propertyId: params.id,
        url,
        sortOrder: idx,
        isCover: idx === 0,
      })),
    });

    // 3. Synchronize amenities
    await prisma.propertyAmenity.deleteMany({
      where: { propertyId: params.id },
    });

    if (amenities && Array.isArray(amenities) && amenities.length > 0) {
      for (const amName of amenities) {
        let am = await prisma.amenity.findUnique({ where: { name: amName } });
        if (!am) {
          am = await prisma.amenity.create({ data: { name: amName, icon: "Check" } });
        }
        await prisma.propertyAmenity.create({
          data: {
            propertyId: params.id,
            amenityId: am.id,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "تم تحديث بيانات الشقة بنجاح!",
      property: updatedProperty,
    });
  } catch (error: any) {
    console.error("PUT Property Update Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "حدث خطأ أثناء تعديل الإعلان" },
      { status: 500 }
    );
  }
}

// DELETE: Delete property (Only landlord or admin)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "غير مصرح لك بحذف العقار" },
        { status: 401 }
      );
    }

    const existingProperty = await prisma.property.findUnique({
      where: { id: params.id },
    });

    if (!existingProperty) {
      return NextResponse.json(
        { success: false, error: "العقار غير موجود" },
        { status: 404 }
      );
    }

    const isOwner = existingProperty.landlordId === user.id || user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: "غير مصرح لك بحذف هذا الإعلان" },
        { status: 403 }
      );
    }

    await prisma.property.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "تم حذف الإعلان بنجاح",
    });
  } catch (error: any) {
    console.error("DELETE Property Error:", error);
    return NextResponse.json(
      { success: false, error: "فشل حذف العقار" },
      { status: 500 }
    );
  }
}
