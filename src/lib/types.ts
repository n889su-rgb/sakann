import { z } from "zod";

export const createPropertySchema = z.object({
  title: z.string().min(5, "العنوان يجب أن يكون 5 أحرف على الأقل").max(120, "العنوان طويل جداً"),
  description: z.string().optional().default(""),
  city: z.string().min(2, "يرجى تحديد المدينة"),
  district: z.string().optional(),
  price: z.coerce.number().min(0, "السعر يجب ألا يكون سالباً").default(0),
  currency: z.enum(["SDG", "USD"]).default("SDG"),
  bedrooms: z.coerce.number().int().min(0, "عدد الغرف يجب ألا يكون سالباً").default(0),
  bathrooms: z.coerce.number().int().min(0, "عدد الحمامات يجب ألا يكون سالباً").default(0),
  contactPhone: z.string().min(9, "رقم الهاتف غير صالح").regex(/^[0-9+\s]+$/, "يرجى إدخال أرقام فقط"),
  whatsappNumber: z.string().optional(),
  amenities: z.array(z.string()).default([]),
  images: z.array(z.string()).min(1, "يرجى إضافة صورة واحدة على الأقل"),
  commissionAgreed: z.literal(true, {
    errorMap: () => ({ message: "يجب الموافقة على تعهد دفع العمولة للمتابعة" }),
  }),
});

export const reportSchema = z.object({
  propertyId: z.string(),
  reason: z.string().min(1, "يرجى تحديد سبب البلاغ"),
  details: z.string().optional(),
  reporterPhone: z.string().optional(),
});

export const leadSchema = z.object({
  propertyId: z.string(),
  type: z.enum(["PHONE_CALL", "WHATSAPP"]),
  viewerPhone: z.string().optional(),
});

export const systemSettingsSchema = z.object({
  commissionEnabled: z.boolean(),
  landlordCommissionPercent: z.number().min(0).max(100),
  tenantCommissionPercent: z.number().min(0).max(100),
  bankakAccountNumber: z.string().optional(),
  bankakAccountName: z.string().optional(),
  contactSupportPhone: z.string().optional(),
});
