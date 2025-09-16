import { AccountType, IRegisterData, TaxNumberType } from '@/shared-generated';
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
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions'
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type IndividualRegisterFormData = z.infer<typeof individualRegisterSchema>;

export const transformToIndividualRegisterData = (data: IndividualRegisterFormData): IRegisterData => {
  return {
    email: data.email,
    password: data.password,
    accountType: AccountType.INDIVIDUAL,
    // Note: confirmPassword is excluded from IRegisterData as it's only for form validation
  };
};

// Business Registration Schema - Aligned with IBusinessRegisterData
export const businessRegisterSchema = z.object({
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
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Geçerli bir telefon numarası girin'),
  accountType: z.literal(AccountType.BUSINESS).optional(),
  password: z
    .string()
    .min(6, 'Şifre en az 6 karakter olmalıdır')
    .max(100, 'Şifre en fazla 100 karakter olabilir'),

  // Business Information - Aligned with IBusinessRegisterData
  businessName: z
    .string()
    .min(2, 'İşletme adı en az 2 karakter olmalıdır')
    .max(100, 'İşletme adı en fazla 100 karakter olabilir'),
  companyName: z
    .string()
    .min(2, 'Şirket adı en az 2 karakter olmalıdır')
    .max(100, 'Şirket adı en fazla 100 karakter olabilir')
    .optional(),
  userTitle: z
    .string()
    .min(2, 'Unvan en az 2 karakter olmalıdır')
    .max(100, 'Unvan en fazla 100 karakter olabilir'),
  taxNumber: z
    .string()
    .optional(),
  taxNumberType: z.enum([TaxNumberType.TAX, TaxNumberType.IDENTITY]),
  identityNumber: z
    .string()
    .optional(),
  taxOffice: z
    .string()
    .min(2, 'Vergi dairesi gereklidir'),
  mainCategoryId: z
    .string()
    .min(1, 'Lütfen ana kategori seçin'),
  subCategoryIds: z
    .array(z.string())
    .default([]),

  // Business Address Information (mapped to IAddress)
  address: z.object({
    street: z.string().optional(),
    doorNumber: z.string().optional(),
    neighborhood: z.string().optional(),
    district: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().min(1, 'Ülke gereklidir'),
    coordinates: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }).optional(),
  }),

  // Business Details
  website: z.string().url('Geçerli bir website URL\'si girin').optional().or(z.literal('')),
  industry: z.string().optional(),
  companySize: z.string().optional(), // CompanySize enum value
  description: z.string().optional(),

  // Form-specific fields (not in IBusinessRegisterData)
  confirmPassword: z.string(),
  acceptTerms: z
    .boolean()
    .refine(val => val === true, {
      message: 'Hizmet şartlarını ve gizlilik politikasını kabul etmelisiniz'
    }),
  marketingConsent: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
}).superRefine((data, ctx) => {
  // Ensure either tax number or identity number is provided based on type
  if (data.taxNumberType === TaxNumberType.TAX) {
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
  } else if (data.taxNumberType === TaxNumberType.IDENTITY) {
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

  // If companyName is not provided, use businessName as default
  if (!data.companyName) {
    (data as any).companyName = data.businessName;
  }
});

export type BusinessRegisterFormData = z.infer<typeof businessRegisterSchema>;

// Transformation utility to convert form data to IBusinessRegisterData
export const transformToBusinessRegisterData = (
  formData: BusinessRegisterFormData,
  ownerId: string
): import('@/shared-generated').IBusinessRegisterData => {
  return {
    // IRegisterData fields
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
    phone: formData.phone,
    password: formData.password,
    accountType: formData.accountType || AccountType.BUSINESS,

    // IBusinessRegisterData specific fields
    businessName: formData.businessName,
    userTitle: formData.userTitle,
    companyName: formData.companyName || formData.businessName,
    taxNumber: formData.taxNumber || '',
    taxNumberType: formData.taxNumberType,
    identityNumber: formData.identityNumber,
    taxOffice: formData.taxOffice,

    // Transform address format to match IAddress interface
    address: {
      street: formData.address.street || '',
      city: formData.address.city || '',
      state: formData.address.state || '',
      zipCode: formData.address.postalCode || '', // Map postalCode to zipCode
      country: formData.address.country,
      doorNumber: formData.address.doorNumber,
      neighborhood: formData.address.neighborhood,
      district: formData.address.district,
      postalCode: formData.address.postalCode,
      coordinates: formData.address.coordinates,
    },

    website: formData.website,
    industry: formData.industry || '',
    companySize: formData.companySize as import('@/shared-generated').CompanySize,
    mainCategoryId: formData.mainCategoryId,
    subCategoryIds: formData.subCategoryIds,
    description: formData.description,
    ownerId: ownerId,
  };
};
