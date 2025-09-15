import { AccountType } from '@/shared-generated';
import { z } from 'zod';

// Login Schema
export const loginSchema = z.object({
  email: z.email('Geçerli bir e-posta adresi girin'),
  password: z
    .string()
    .min(1, 'Şifre gereklidir'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Password Reset Schema
export const passwordResetSchema = z.object({
  email: z.email('Geçerli bir e-posta adresi girin'),
});

export type PasswordResetFormData = z.infer<typeof passwordResetSchema>;

// Password Reset Completion Schema
export const passwordResetCompletionSchema = z.object({
  password: z
    .string()
    .min(6, 'Şifre en az 6 karakter olmalıdır')
    .max(100, 'Şifre en fazla 100 karakter olabilir'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
});

export type PasswordResetCompletionFormData = z.infer<typeof passwordResetCompletionSchema>;

// Password Change Schema
export const passwordChangeSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Mevcut şifre gereklidir'),
  newPassword: z
    .string()
    .min(6, 'Yeni şifre en az 6 karakter olmalıdır')
    .max(100, 'Yeni şifre en fazla 100 karakter olabilir'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
});

export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

// Individual Registration Schema
export const individualRegisterSchema = z.object({
  email: z.email('Geçerli bir e-posta adresi girin'),
  password: z
    .string()
    .min(6, 'Şifre en az 6 karakter olmalıdır')
    .max(100, 'Şifre en fazla 100 karakter olabilir'),
  confirmPassword: z.string(),
  acceptTerms: z
    .boolean()
    .refine(val => val === true, {
      message: 'Hizmet şartlarını ve gizlilik politikasını kabul etmelisiniz'
    }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
});

export type IndividualRegisterFormData = z.infer<typeof individualRegisterSchema>;

// Business Registration Schema
export const businessRegisterSchema = z.object({
  // Business Information
  businessName: z
    .string()
    .min(2, 'İşletme adı en az 2 karakter olmalıdır')
    .max(100, 'İşletme adı en fazla 100 karakter olabilir'),
  taxNumber: z
    .string()
    .optional(),
  identityNumber: z
    .string()
    .optional(),
  taxNumberType: z.enum(['tax', 'identity']).optional(),
  taxOffice: z
    .string()
    .min(2, 'Vergi dairesi gereklidir')
    .optional(),
  userTitle: z
    .string()
    .min(2, 'Kullanıcı ünvanı gereklidir'),
  mainCategoryId: z
    .string()
    .min(1, 'Lütfen ana kategori seçin'),

  // Personal Information (extends IRegisterData)
  firstName: z
    .string()
    .min(2, 'Ad en az 2 karakter olmalıdır')
    .max(50, 'Ad en fazla 50 karakter olabilir'),
  lastName: z
    .string()
    .min(2, 'Soyad en az 2 karakter olmalıdır')
    .max(50, 'Soyad en fazla 50 karakter olabilir'),
  email: z
    .string()
    .email('Geçerli bir e-posta adresi girin'),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Geçerli bir telefon numarası girin'),
  accountType: z.literal(AccountType.BUSINESS).optional(),
  acceptTerms: z
    .boolean()
    .refine(val => val === true, {
      message: 'Hizmet şartlarını ve gizlilik politikasını kabul etmelisiniz'
    }),
  marketingConsent: z.boolean().optional(),

  // Business Address Information
  businessAddress: z.object({
    street: z.string().min(1, 'Sokak adresi gereklidir'),
    doorNumber: z.string().min(1, 'Kapı numarası gereklidir'),
    neighborhood: z.string().optional(),
    district: z.string().min(1, 'İlçe gereklidir'),
    city: z.string().min(1, 'İl gereklidir'),
    state: z.string().min(1, 'Bölge gereklidir'),
    postalCode: z
      .string()
      .regex(/^\d{5}$/, 'Posta kodu 5 haneli olmalıdır'),
    country: z.string().min(1, 'Ülke gereklidir'),
    coordinates: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }).optional(),
  }).optional(),

  website: z.string().url('Geçerli bir website URL\'si girin').optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(), // CompanySize enum value

  // Password
  password: z
    .string()
    .min(6, 'Şifre en az 6 karakter olmalıdır')
    .max(100, 'Şifre en fazla 100 karakter olabilir'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
}).superRefine((data, ctx) => {
  // Ensure either tax number or identity number is provided based on type
  if (data.taxNumberType === 'tax') {
    if (!data.taxNumber) {
      ctx.addIssue({
        code: "custom",
        message: 'Vergi numarası gereklidir',
        path: ['taxNumber'],
      });
    } else if (!/^\d{10}$/.test(data.taxNumber)) {
      ctx.addIssue({
        code: "custom",
        message: 'Vergi numarası 10 haneli olmalıdır',
        path: ['taxNumber'],
      });
    }
  } else if (data.taxNumberType === 'identity') {
    if (!data.identityNumber) {
      ctx.addIssue({
        code: "custom",
        message: 'TC kimlik numarası gereklidir',
        path: ['identityNumber'],
      });
    } else if (!/^[1-9][0-9]{10}$/.test(data.identityNumber)) {
      ctx.addIssue({
        code: "custom",
        message: 'TC kimlik numarası 11 haneli olmalıdır',
        path: ['identityNumber'],
      });
    }
  }
});

export type BusinessRegisterFormData = z.infer<typeof businessRegisterSchema>;
