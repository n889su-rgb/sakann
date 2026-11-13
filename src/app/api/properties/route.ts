import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createPropertySchema } from "@/lib/types";
import { stripHtmlTags } from "@/lib/sanitize";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const city = searchParams.get("city") || "";
    const currency = searchParams.get("currency") || "";
    const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;
    const bedrooms = searchParams.get("bedrooms") ? parseInt(searchParams.get("bedrooms")!) : undefined;
    const status = searchParams.get("status") || "ACTIVE";

    const whereClause: any = {
      status: status === "ALL" ? undefined : status,
    };

    if (city) {
      whereClause.city = city;
    }

    if (currency) {
      whereClause.currency = currency;
    }

    if (maxPrice && maxPrice > 0) {
      whereClause.price = { lte: maxPrice };
    }

    if (bedrooms && bedrooms > 0) {
      whereClause.bedrooms = { gte: bedrooms };
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { city: { contains: search } },
        { district: { contains: search } },
      ];
    }

    const properties = await prisma.property.findMany({
      where: whereClause,
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        amenities: { include: { amenity: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Check if requester is logged in or a guest
    const user = await getCurrentUser();
    const isGuest = !user;

    // Mask landlord contact info for guest visitors
    const sanitizedProperties = properties.map((prop) => {
      if (isGuest) {
        return {
          ...prop,
          contactPhone: "مخفي للضيوف",
          whatsappNumber: null,
        };
      }
      return prop;
    });

    return NextResponse.json({ success: true, properties: sanitizedProperties, isGuest });
  } catch (error: any) {
    console.error("API Properties GET Error:", error);
    return NextResponse.json({ success: false, error: "فشل جلب العقارات" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Rate Limiting (Max 10 property additions per minute per IP)
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(`prop_post_${ip}`, { limit: 10, windowMs: 60 * 1000 });
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, error: "تم تجاوز الحد المسموح به لإضافة العقارات مؤقتاً، يرجى الانتظار قليلاً" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validated = createPropertySchema.parse(body);

    const currentUser = await getCurrentUser();
    let landlordId: string;

    if (currentUser) {
      landlordId = currentUser.id;
    } else {
      // Find default landlord or use provided phone
      let landlord = await prisma.user.findFirst({
        where: { phone: validated.contactPhone },
      });

      if (!landlord) {
        landlord = await prisma.user.create({
          data: {
            name: "معلن عقار",
            phone: validated.contactPhone,
            passwordHash: "auto-generated",
            role: "USER",
          },
        });
      }
      landlordId = landlord.id;
    }

    // Sanitize user inputs to prevent XSS attacks
    const safeTitle = stripHtmlTags(validated.title);
    const safeDescription = stripHtmlTags(validated.description || "");
    const safeCity = stripHtmlTags(validated.city);
    const safeDistrict = stripHtmlTags(validated.district);

    // Instant publish - status ACTIVE
    const property = await prisma.property.create({
      data: {
        title: safeTitle,
        description: safeDescription,
        city: safeCity,
        district: safeDistrict,
        price: validated.price,
        currency: validated.currency,
        bedrooms: validated.bedrooms,
        bathrooms: validated.bathrooms,
        contactPhone: validated.contactPhone,
        whatsappNumber: validated.whatsappNumber || validated.contactPhone,
        status: "ACTIVE", // INSTANT APPROVAL!
        landlordId,
        images: {
          create: validated.images.map((url, idx) => ({
            url,
            sortOrder: idx,
            isCover: idx === 0,
          })),
        },
      },
    });

    // Link amenities if any
    if (validated.amenities && validated.amenities.length > 0) {
      for (const amName of validated.amenities) {
        let am = await prisma.amenity.findUnique({ where: { name: amName } });
        if (!am) {
          am = await prisma.amenity.create({ data: { name: amName, icon: "Check" } });
        }
        await prisma.propertyAmenity.create({
          data: {
            propertyId: property.id,
            amenityId: am.id,
          },
        });
      }
    }

    return NextResponse.json({ success: true, property, message: "تم نشر العقار فوراً بنجاح!" });
  } catch (error: any) {
    console.error("API Property Create Error:", error);
    return NextResponse.json(
      { success: false, error: error.errors?.[0]?.message || error.message || "فشل نشر العقار" },
      { status: 400 }
    );
  }
}
