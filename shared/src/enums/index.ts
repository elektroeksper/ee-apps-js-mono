// Common enums for the Electro Expert application

enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
  VENDOR = 'vendor',
  SUPPORT = 'support'
}

enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

enum ProductCategory {
  SMARTPHONES = 'smartphones',
  LAPTOPS = 'laptops',
  TABLETS = 'tablets',
  ACCESSORIES = 'accessories',
  AUDIO = 'audio',
  WEARABLES = 'wearables',
  GAMING = 'gaming',
  HOME_APPLIANCES = 'home_appliances'
}

enum NotificationType {
  ORDER_UPDATE = 'order_update',
  PRODUCT_BACK_IN_STOCK = 'product_back_in_stock',
  PRICE_DROP = 'price_drop',
  PROMOTIONAL = 'promotional',
  SYSTEM = 'system'
}

enum OperationStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  CANCELLED = 'cancelled'
}



// Account Types
enum AccountType {
  INDIVIDUAL = 'individual',
  BUSINESS = 'business'
}

// User Roles
enum AuthRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator'
}

// Authentication States
enum AuthState {
  LOADING = 'loading',
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated',
  ERROR = 'error'
}


// Common Auth Error Codes
enum AuthErrorCode {
  EMAIL_ALREADY_IN_USE = 'auth/email-already-in-use',
  INVALID_EMAIL = 'auth/invalid-email',
  OPERATION_NOT_ALLOWED = 'auth/operation-not-allowed',
  WEAK_PASSWORD = 'auth/weak-password',
  USER_DISABLED = 'auth/user-disabled',
  USER_NOT_FOUND = 'auth/user-not-found',
  WRONG_PASSWORD = 'auth/wrong-password',
  TOO_MANY_REQUESTS = 'auth/too-many-requests',
  NETWORK_REQUEST_FAILED = 'auth/network-request-failed',
  PROFILE_INCOMPLETE = 'app/profile-incomplete',
  EMAIL_NOT_VERIFIED = 'app/email-not-verified',
  INSUFFICIENT_PERMISSIONS = 'app/insufficient-permissions',
  INVALID_ACCOUNT_TYPE = 'app/invalid-account-type',
  BUSINESS_VERIFICATION_REQUIRED = 'app/business-verification-required'
};


// Company Size Enum
enum CompanySize {
  STARTUP = '1-10',
  SMALL = '11-50',
  MEDIUM = '51-200',
  LARGE = '201-1000',
  ENTERPRISE = '1000+'
}


// Document Types
enum DocumentType {
  BUSINESS_LICENSE = 'business_license',
  TAX_CERTIFICATE = 'tax_certificate',
  ARTICLES_OF_INCORPORATION = 'articles_of_incorporation',
  UTILITY_BILL = 'utility_bill',
  OTHER = 'other'
}

// Document Status
enum DocumentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

// Business Verification Status
enum BusinessVerificationStatus {
  UNVERIFIED = 'unverified',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected'
}


export {
  AccountType, AuthErrorCode, AuthRole, AuthState,
  BusinessVerificationStatus,
  CompanySize, DocumentStatus, DocumentType, NotificationType,
  OperationStatus, OrderStatus,
  PaymentStatus,
  ProductCategory, UserRole
};

