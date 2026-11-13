import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Sakan Database Seeding...");

  // 1. System Settings
  const settings = await prisma.systemSetting.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      commissionEnabled: true,
      landlordCommissionPercent: 5.0,
      tenantCommissionPercent: 5.0,
      bankakAccountNumber: "2345678",
      bankakAccountName: "منصة سكن العقارية",
      contactSupportPhone: "0111900328",
    },
  });
  console.log("✅ System settings configured:", settings.id);

  // 2. Admin User
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { phone: "0111900328" },
    update: {},
    create: {
      name: "مدير منصة سكن",
      phone: "0111900328",
      email: "admin@sakan.app",
      passwordHash: adminPassword,
      role: "ADMIN",
      isVerified: true,
    },
  });
  console.log("✅ Admin user created:", admin.name);

  // 3. Landlord User
  const landlordPassword = await bcrypt.hash("landlord123", 10);
  const landlord = await prisma.user.upsert({
    where: { phone: "0912345678" },
    update: {},
    create: {
      name: "محمد عثمان (مالك)",
      phone: "0912345678",
      email: "landlord@sakan.app",
      passwordHash: landlordPassword,
      role: "USER",
      isVerified: true,
    },
  });

  // 4. Amenities
  const amenitiesList = [
    { name: "تكييف اسبليت", icon: "Wind" },
    { name: "منظومة طاقة شمسية 24 ساعة", icon: "Sun" },
    { name: "إنترنت ستارلينك فائق السرعة", icon: "Wifi" },
    { name: "مولد كهربائي أوتوماتيك", icon: "Zap" },
    { name: "مطبخ مجهز بالكامل", icon: "Utensils" },
    { name: "غسالة أوتوماتيك", icon: "Shirt" },
    { name: "مصعد كهربائي", icon: "ArrowUpDown" },
    { name: "حراسة وأمن على مدار الساعة", icon: "ShieldCheck" },
    { name: "موقف سيارات مظلل", icon: "Car" },
    { name: "شاشة تلفزيون ذكية", icon: "Tv" },
  ];

  for (const am of amenitiesList) {
    await prisma.amenity.upsert({
      where: { name: am.name },
      update: {},
      create: am,
    });
  }
  console.log("✅ Amenities seeded.");

  const allAmenities = await prisma.amenity.findMany();

  // 5. Sample Furnished Properties
  const sampleProperties = [
    {
      title: "شقة فندقية فاخرة بإطلالة مميزة وطاقة شمسية 24 ساعة",
      description: "شقة مفروشة بالكامل بأثاث تركي فاخر ومكيفات اسبليت جديدة في كل الغرف. تحتوي على منظومة طاقة شمسية متكاملة تضمن الكهرباء 24 ساعة بدون انقطاع، بالإضافة لإنترنت ستارلينك مفتوح وسريع. قريبة من جميع الخدمات والأسواق.",
      city: "بورتسودان",
      district: "حي المطار",
      price: 650.0,
      currency: "USD",
      bedrooms: 2,
      bathrooms: 2,
      contactPhone: "0912345678",
      whatsappNumber: "0912345678",
      status: "ACTIVE",
      landlordId: landlord.id,
      images: [
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1000&q=80"
      ],
      selectedAmenities: ["تكييف اسبليت", "منظومة طاقة شمسية 24 ساعة", "إنترنت ستارلينك فائق السرعة", "مطبخ مجهز بالكامل", "حراسة وأمن على مدار الساعة"],
    },
    {
      title: "شقة عائلية هادئة 3 غرف قريبة من شارع النيل",
      description: "شقة واسعة ومجهزة بفرش مريح ونظيف، مناسبة جداً للعائلات والبعثات. تتوفر بها غسالة أوتوماتيك وثلاجة كبيرة ومطبخ متكامل، مع وجود مصعد وموقف سيارات خاص ومولد كهربائي.",
      city: "الخرطوم",
      district: "الرياض",
      price: 1800000.0,
      currency: "SDG",
      bedrooms: 3,
      bathrooms: 2,
      contactPhone: "0123456789",
      whatsappNumber: "0123456789",
      status: "ACTIVE",
      landlordId: landlord.id,
      images: [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1502005229762-ee1b2b93e08f?auto=format&fit=crop&w=1000&q=80"
      ],
      selectedAmenities: ["تكييف اسبليت", "مولد كهربائي أوتوماتيك", "مطبخ مجهز بالكامل", "غسالة أوتوماتيك", "مصعد كهربائي", "موقف سيارات مظلل"],
    },
    {
      title: "استوديو مفروش مودرن للأفراد أو الكوادر الطبية",
      description: "استوديو راقي يتكون من غرفة نوم رئيسية مريحة وصالة استقبال صغيرة مع ركن مطبخ تحضيري وحمام فاخر. موقع آمن وقريب من المستشفيات والخدمات، إنترنت سريع متوفر وتكييف بارد.",
      city: "أم درمان",
      district: "حي المهندسين",
      price: 350.0,
      currency: "USD",
      bedrooms: 1,
      bathrooms: 1,
      contactPhone: "0998877665",
      whatsappNumber: "0998877665",
      status: "ACTIVE",
      landlordId: landlord.id,
      images: [
        "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=1000&q=80",
        "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1000&q=80"
      ],
      selectedAmenities: ["تكييف اسبليت", "إنترنت ستارلينك فائق السرعة", "شاشة تلفزيون ذكية", "منظومة طاقة شمسية 24 ساعة"],
    },
  ];

  for (const p of sampleProperties) {
    const existing = await prisma.property.findFirst({ where: { title: p.title } });
    if (!existing) {
      const created = await prisma.property.create({
        data: {
          title: p.title,
          description: p.description,
          city: p.city,
          district: p.district,
          price: p.price,
          currency: p.currency,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          contactPhone: p.contactPhone,
          whatsappNumber: p.whatsappNumber,
          status: p.status,
          landlordId: p.landlordId,
          images: {
            create: p.images.map((url, idx) => ({
              url,
              sortOrder: idx,
              isCover: idx === 0,
            })),
          },
          amenities: {
            create: p.selectedAmenities.map((amName) => ({
              amenity: {
                connect: { name: amName },
              },
            })),
          },
        },
      });
      console.log(`✅ Property created: ${created.title} (${created.city})`);
    }
  }

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
