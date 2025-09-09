/**
 * Firebase Error Messages in Turkish and English
 * Comprehensive error handling for Firebase services:
 * - Authentication
 * - Storage
 * - Firestore
 * 
 * Shared across all projects in the monorepo
 */

interface FirebaseErrorMessage {
  en: string;
  tr: string;
}

// ===== AUTHENTICATION ERROR MESSAGES =====
export const authErrorMessages: Record<string, FirebaseErrorMessage> = {
  // Email/Password Authentication Errors
  'auth/user-not-found': {
    en: 'No user account found with this email address',
    tr: 'Bu e-posta adresi ile kayıtlı hesap bulunamadı'
  },
  'auth/wrong-password': {
    en: 'Incorrect password',
    tr: 'Hatalı şifre'
  },
  'auth/invalid-email': {
    en: 'Invalid email address format',
    tr: 'Geçersiz e-posta adresi'
  },
  'auth/invalid-password': {
    en: 'Invalid password',
    tr: 'Geçersiz şifre'
  },
  'auth/user-disabled': {
    en: 'This account has been disabled',
    tr: 'Bu hesap devre dışı bırakılmış'
  },
  'auth/email-already-in-use': {
    en: 'This email address is already in use',
    tr: 'Bu e-posta adresi zaten kullanımda'
  },
  'auth/weak-password': {
    en: 'Password is too weak, must be at least 6 characters',
    tr: 'Şifre çok zayıf, en az 6 karakter olmalı'
  },
  'auth/invalid-credential': {
    en: 'Invalid login credentials',
    tr: 'Geçersiz giriş bilgileri'
  },
  'auth/credential-already-in-use': {
    en: 'These credentials are already linked to another account',
    tr: 'Bu kimlik bilgileri zaten başka bir hesapla bağlantılı'
  },
  'auth/invalid-verification-code': {
    en: 'Invalid verification code',
    tr: 'Geçersiz doğrulama kodu'
  },
  'auth/invalid-verification-id': {
    en: 'Invalid verification ID',
    tr: 'Geçersiz doğrulama kimliği'
  },
  'auth/invalid-login-credentials': {
    en: 'Invalid login credentials',
    tr: 'Geçersiz giriş bilgileri'
  },

  // Account Management Errors
  'auth/requires-recent-login': {
    en: 'This operation requires recent login. Please sign in again',
    tr: 'Bu işlem için yeniden giriş yapmanız gerekiyor'
  },
  'auth/too-many-requests': {
    en: 'Too many failed attempts. Please try again later',
    tr: 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin'
  },
  'auth/network-request-failed': {
    en: 'Network connection error. Please check your internet connection',
    tr: 'Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin'
  },
  'auth/timeout': {
    en: 'Operation timed out. Please try again',
    tr: 'İşlem zaman aşımına uğradı. Lütfen tekrar deneyin'
  },
  'auth/user-mismatch': {
    en: 'The provided credentials do not match the signed-in user',
    tr: 'Sağlanan kimlik bilgileri daha önce giriş yapan kullanıcıya ait değil'
  },
  'auth/user-signed-out': {
    en: 'User has been signed out',
    tr: 'Kullanıcı oturumu kapatılmış'
  },
  'auth/credential-too-old-login-again': {
    en: 'This operation requires recent login. Please sign in again',
    tr: 'Bu işlem için yeniden giriş yapmanız gerekiyor'
  },

  // Google Sign-in & OAuth Errors
  'auth/popup-closed-by-user': {
    en: 'Sign-in popup was closed',
    tr: 'Giriş penceresi kapatıldı'
  },
  'auth/popup-blocked': {
    en: 'Popup was blocked. Please check your browser settings',
    tr: 'Popup engellendi. Tarayıcı ayarlarınızı kontrol edin'
  },
  'auth/cancelled-popup-request': {
    en: 'Sign-in process was cancelled',
    tr: 'Giriş işlemi iptal edildi'
  },
  'auth/account-exists-with-different-credential': {
    en: 'This email is already registered with a different sign-in method',
    tr: 'Bu e-posta başka bir giriş yöntemiyle zaten kayıtlı'
  },
  'auth/redirect-cancelled-by-user': {
    en: 'Redirect operation was cancelled by user',
    tr: 'Yönlendirme işlemi kullanıcı tarafından iptal edildi'
  },
  'auth/redirect-operation-pending': {
    en: 'A redirect operation is already in progress',
    tr: 'Bir yönlendirme işlemi zaten devam ediyor'
  },
  'auth/invalid-oauth-provider': {
    en: 'Invalid OAuth provider',
    tr: 'Geçersiz OAuth sağlayıcısı'
  },
  'auth/invalid-oauth-client-id': {
    en: 'Invalid OAuth client ID',
    tr: 'Geçersiz OAuth istemci kimliği'
  },

  // Phone Authentication Errors
  'auth/invalid-phone-number': {
    en: 'Invalid phone number format',
    tr: 'Geçersiz telefon numarası'
  },
  'auth/missing-phone-number': {
    en: 'Phone number is required',
    tr: 'Telefon numarası gerekli'
  },
  'auth/quota-exceeded': {
    en: 'SMS quota has been exceeded',
    tr: 'SMS kotası aşıldı'
  },
  'auth/captcha-check-failed': {
    en: 'reCAPTCHA verification failed',
    tr: 'reCAPTCHA doğrulaması başarısız'
  },
  'auth/missing-verification-code': {
    en: 'Verification code is missing',
    tr: 'Doğrulama kodu eksik'
  },
  'auth/missing-verification-id': {
    en: 'Verification ID is missing',
    tr: 'Doğrulama kimliği eksik'
  },
  'auth/code-expired': {
    en: 'SMS code has expired',
    tr: 'SMS kodu süresi dolmuş'
  },
  'auth/session-expired': {
    en: 'Session has expired',
    tr: 'Oturum süresi dolmuş'
  },

  // Multi-factor Authentication Errors
  'auth/multi-factor-auth-required': {
    en: 'Multi-factor authentication is required',
    tr: 'Çok faktörlü kimlik doğrulama gerekli'
  },
  'auth/multi-factor-info-not-found': {
    en: 'Multi-factor authentication info not found',
    tr: 'Çok faktörlü kimlik doğrulama bilgisi bulunamadı'
  },
  'auth/multi-factor-session-invalid': {
    en: 'Multi-factor session is invalid',
    tr: 'Çok faktörlü oturum geçersiz'
  },
  'auth/second-factor-already-enrolled': {
    en: 'Second factor is already enrolled',
    tr: 'İkinci faktör zaten kayıtlı'
  },
  'auth/second-factor-limit-exceeded': {
    en: 'Maximum number of second factors exceeded',
    tr: 'Maksimum ikinci faktör sayısı aşıldı'
  },

  // Custom Token & Admin Errors
  'auth/invalid-custom-token': {
    en: 'Custom token format is incorrect',
    tr: 'Özel token formatı hatalı'
  },
  'auth/custom-token-mismatch': {
    en: 'Custom token corresponds to a different audience',
    tr: 'Özel token farklı bir hedef kitleye ait'
  },
  'auth/admin-restricted-operation': {
    en: 'This operation is restricted to administrators only',
    tr: 'Bu işlem sadece yöneticiler tarafından yapılabilir'
  },
  'auth/invalid-api-key': {
    en: 'Invalid API key',
    tr: 'Geçersiz API anahtarı'
  },
  'auth/app-not-authorized': {
    en: 'App is not authorized to use Firebase Authentication',
    tr: 'Uygulama Firebase kimlik doğrulaması kullanma yetkisine sahip değil'
  },

  // Token & Session Errors
  'auth/invalid-user-token': {
    en: 'User token is invalid',
    tr: 'Kullanıcı tokeni geçersiz'
  },
  'auth/token-expired': {
    en: 'User token has expired',
    tr: 'Kullanıcı tokeni süresi dolmuş'
  },
  'auth/null-user': {
    en: 'No user is currently signed in',
    tr: 'Şu anda oturum açmış kullanıcı yok'
  },
  'auth/invalid-auth-event': {
    en: 'Invalid authentication event',
    tr: 'Geçersiz kimlik doğrulama olayı'
  },

  // Configuration & Environment Errors
  'auth/operation-not-allowed': {
    en: 'This operation is not allowed. Check Firebase console configuration',
    tr: 'Bu işleme izin verilmiyor. Firebase konsol yapılandırmasını kontrol edin'
  },
  'auth/operation-not-supported-in-this-environment': {
    en: 'This operation is not supported in this environment',
    tr: 'Bu işlem bu ortamda desteklenmiyor'
  },
  'auth/invalid-dynamic-link-domain': {
    en: 'Dynamic link domain is not configured or authorized',
    tr: 'Dinamik bağlantı etki alanı yapılandırılmamış veya yetkilendirilmemiş'
  },
  'auth/unauthorized-domain': {
    en: 'This domain is not authorized for OAuth operations',
    tr: 'Bu etki alanı OAuth işlemleri için yetkilendirilmemiş'
  },

  // General & Unknown Errors
  'auth/internal-error': {
    en: 'An internal error occurred. Please try again',
    tr: 'Dahili bir hata oluştu. Lütfen tekrar deneyin'
  },
  'auth/app-deleted': {
    en: 'This Firebase app instance has been deleted',
    tr: 'Bu Firebase uygulama örneği silinmiş'
  },
  'auth/already-initialized': {
    en: 'Firebase Auth has already been initialized',
    tr: 'Firebase Auth zaten başlatılmış'
  },

  // Additional specific error codes
  'auth/cors-unsupported': {
    en: 'This browser is not supported',
    tr: 'Bu tarayıcı desteklenmiyor'
  },
  'auth/credential-mismatch': {
    en: 'The custom token corresponds to a different audience',
    tr: 'Özel token farklı bir hedef kitleye ait'
  },
  'auth/dependent-sdk-initialized-before-auth': {
    en: 'Another Firebase SDK was initialized before Auth',
    tr: 'Başka bir Firebase SDK, Auth\'dan önce başlatıldı'
  },
  'auth/dynamic-link-not-activated': {
    en: 'Dynamic Links must be activated in Firebase Console',
    tr: 'Dinamik Bağlantılar Firebase Konsolunda etkinleştirilmeli'
  },
  'auth/email-change-needs-verification': {
    en: 'Email change requires verification',
    tr: 'E-posta değişikliği doğrulama gerektiriyor'
  },
  'auth/emulator-config-failed': {
    en: 'Auth Emulator configuration failed',
    tr: 'Auth Emülatör yapılandırması başarısız'
  },
  'auth/expired-action-code': {
    en: 'Action code has expired',
    tr: 'İşlem kodu süresi dolmuş'
  },
  'auth/invalid-action-code': {
    en: 'Invalid action code',
    tr: 'Geçersiz işlem kodu'
  },
  'auth/invalid-app-credential': {
    en: 'Invalid app credential',
    tr: 'Geçersiz uygulama kimlik bilgisi'
  },
  'auth/invalid-app-id': {
    en: 'Invalid app ID',
    tr: 'Geçersiz uygulama kimliği'
  },
  'auth/invalid-cert-hash': {
    en: 'Invalid certificate hash',
    tr: 'Geçersiz sertifika hash\'i'
  },
  'auth/invalid-continue-uri': {
    en: 'Invalid continue URL',
    tr: 'Geçersiz devam URL\'si'
  },
  'auth/invalid-cordova-configuration': {
    en: 'Invalid Cordova configuration',
    tr: 'Geçersiz Cordova yapılandırması'
  },
  'auth/invalid-emulator-scheme': {
    en: 'Invalid emulator scheme',
    tr: 'Geçersiz emülatör şeması'
  },
  'auth/invalid-message-payload': {
    en: 'Invalid email template message payload',
    tr: 'Geçersiz e-posta şablonu mesaj yükü'
  },
  'auth/invalid-multi-factor-session': {
    en: 'Invalid multi-factor session',
    tr: 'Geçersiz çok faktörlü oturum'
  },
  'auth/invalid-persistence-type': {
    en: 'Invalid persistence type',
    tr: 'Geçersiz kalıcılık türü'
  },
  'auth/invalid-provider-id': {
    en: 'Invalid provider ID',
    tr: 'Geçersiz sağlayıcı kimliği'
  },
  'auth/invalid-recipient-email': {
    en: 'Invalid recipient email',
    tr: 'Geçersiz alıcı e-postası'
  },
  'auth/invalid-sender': {
    en: 'Invalid sender',
    tr: 'Geçersiz gönderici'
  },
  'auth/invalid-tenant-id': {
    en: 'Invalid tenant ID',
    tr: 'Geçersiz kiracı kimliği'
  },
  'auth/missing-android-package-name': {
    en: 'Missing Android package name',
    tr: 'Android paket adı eksik'
  },
  'auth/missing-app-credential': {
    en: 'Missing app credential',
    tr: 'Uygulama kimlik bilgisi eksik'
  },
  'auth/missing-client-type': {
    en: 'Missing client type',
    tr: 'İstemci türü eksik'
  },
  'auth/missing-continue-uri': {
    en: 'Missing continue URI',
    tr: 'Devam URI\'si eksik'
  },
  'auth/missing-ios-bundle-id': {
    en: 'Missing iOS bundle ID',
    tr: 'iOS paket kimliği eksik'
  },
  'auth/missing-multi-factor-info': {
    en: 'Missing multi-factor info',
    tr: 'Çok faktörlü bilgi eksik'
  },
  'auth/missing-multi-factor-session': {
    en: 'Missing multi-factor session',
    tr: 'Çok faktörlü oturum eksik'
  },
  'auth/missing-or-invalid-nonce': {
    en: 'Missing or invalid nonce',
    tr: 'Eksik veya geçersiz nonce'
  },
  'auth/missing-password': {
    en: 'Missing password',
    tr: 'Şifre eksik'
  },
  'auth/no-auth-event': {
    en: 'No auth event',
    tr: 'Kimlik doğrulama olayı yok'
  },
  'auth/no-such-provider': {
    en: 'No such provider',
    tr: 'Böyle bir sağlayıcı yok'
  },
  'auth/provider-already-linked': {
    en: 'Provider already linked',
    tr: 'Sağlayıcı zaten bağlantılı'
  },
  'auth/recaptcha-not-enabled': {
    en: 'reCAPTCHA is not enabled',
    tr: 'reCAPTCHA etkin değil'
  },
  'auth/missing-recaptcha-token': {
    en: 'Missing reCAPTCHA token',
    tr: 'reCAPTCHA tokeni eksik'
  },
  'auth/invalid-recaptcha-token': {
    en: 'Invalid reCAPTCHA token',
    tr: 'Geçersiz reCAPTCHA tokeni'
  },
  'auth/invalid-recaptcha-action': {
    en: 'Invalid reCAPTCHA action',
    tr: 'Geçersiz reCAPTCHA eylemi'
  },
  'auth/unauthorized-continue-uri': {
    en: 'Unauthorized continue URI',
    tr: 'Yetkisiz devam URI\'si'
  },
  'auth/unverified-email': {
    en: 'Email is not verified',
    tr: 'E-posta doğrulanmamış'
  },
  'auth/user-cancelled': {
    en: 'User cancelled the operation',
    tr: 'Kullanıcı işlemi iptal etti'
  },
  'auth/web-storage-unsupported': {
    en: 'Web storage is not supported',
    tr: 'Web depolama desteklenmiyor'
  }
};

// ===== FIREBASE STORAGE ERROR MESSAGES =====
export const storageErrorMessages: Record<string, FirebaseErrorMessage> = {
  // Object and Bucket Errors
  'storage/object-not-found': {
    en: 'No object exists at the desired reference',
    tr: 'İstenen referansta hiçbir nesne bulunmuyor'
  },
  'storage/bucket-not-found': {
    en: 'No bucket is configured for Cloud Storage',
    tr: 'Cloud Storage için yapılandırılmış paket bulunmuyor'
  },
  'storage/project-not-found': {
    en: 'No project is configured for Cloud Storage',
    tr: 'Cloud Storage için yapılandırılmış proje bulunmuyor'
  },

  // Authentication and Authorization Errors
  'storage/unauthenticated': {
    en: 'User is unauthenticated. Please authenticate and try again',
    tr: 'Kullanıcı kimliği doğrulanmamış. Lütfen kimlik doğrulama yapıp tekrar deneyin'
  },
  'storage/unauthorized': {
    en: 'User is not authorized to perform the desired action',
    tr: 'Kullanıcı istenen eylemi gerçekleştirme yetkisine sahip değil'
  },

  // Quota and Limits Errors
  'storage/quota-exceeded': {
    en: 'Quota on your Cloud Storage bucket has been exceeded',
    tr: 'Cloud Storage paketinizdeki kota aşıldı'
  },
  'storage/retry-limit-exceeded': {
    en: 'The maximum time limit on an operation has been exceeded',
    tr: 'Bir işlemde maksimum zaman sınırı aşıldı'
  },

  // Upload and Download Errors
  'storage/invalid-checksum': {
    en: 'File on the client does not match the checksum of the file received by the server',
    tr: 'İstemcideki dosya, sunucu tarafından alınan dosyanın sağlama toplamıyla eşleşmiyor'
  },
  'storage/canceled': {
    en: 'Upload operation was canceled',
    tr: 'Yükleme işlemi iptal edildi'
  },

  // URL and Configuration Errors
  'storage/invalid-url': {
    en: 'Invalid URL provided to refFromURL()',
    tr: 'refFromURL() fonksiyonuna geçersiz URL sağlandı'
  },
  'storage/no-default-bucket': {
    en: 'No default bucket found. Did you set the storageBucket property when initializing the app?',
    tr: 'Varsayılan paket bulunamadı. Uygulamayı başlatırken storageBucket özelliğini ayarladınız mı?'
  },
  'storage/invalid-argument': {
    en: 'Invalid argument provided',
    tr: 'Geçersiz argüman sağlandı'
  },

  // Server and Network Errors
  'storage/server-file-wrong-size': {
    en: 'File on the client does not match the size of the file received by the server',
    tr: 'İstemcideki dosya, sunucu tarafından alınan dosyanın boyutuyla eşleşmiyor'
  },
  'storage/unknown': {
    en: 'An unknown error occurred. Please check the error payload for server response',
    tr: 'Bilinmeyen bir hata oluştu. Sunucu yanıtı için hata yükünü kontrol edin'
  },

  // App and Environment Errors
  'storage/app-deleted': {
    en: 'App was deleted',
    tr: 'Uygulama silindi'
  },
  'storage/internal-error': {
    en: 'An internal error has occurred',
    tr: 'Dahili bir hata oluştu'
  },
  'storage/unsupported-environment': {
    en: 'This operation is not supported in this environment',
    tr: 'Bu işlem bu ortamda desteklenmiyor'
  }
};

// ===== FIRESTORE ERROR MESSAGES =====
export const firestoreErrorMessages: Record<string, FirebaseErrorMessage> = {
  // Operation Status Errors
  'cancelled': {
    en: 'The operation was cancelled',
    tr: 'İşlem iptal edildi'
  },
  'unknown': {
    en: 'Unknown error or an error from a different error domain',
    tr: 'Bilinmeyen hata veya farklı bir hata etki alanından gelen hata'
  },

  // Client Request Errors
  'invalid-argument': {
    en: 'Client specified an invalid argument',
    tr: 'İstemci geçersiz bir argüman belirtti'
  },
  'deadline-exceeded': {
    en: 'Deadline expired before operation could complete',
    tr: 'İşlem tamamlanmadan son tarih doldu'
  },
  'not-found': {
    en: 'Some requested document was not found',
    tr: 'İstenen bazı dokümanlar bulunamadı'
  },
  'already-exists': {
    en: 'Some document that we attempted to create already exists',
    tr: 'Oluşturmaya çalıştığımız bazı dokümanlar zaten mevcut'
  },

  // Permission and Authentication Errors
  'permission-denied': {
    en: 'The caller does not have permission to execute the specified operation',
    tr: 'Arayan, belirtilen işlemi yürütme iznine sahip değil'
  },
  'unauthenticated': {
    en: 'The request does not have valid authentication credentials for the operation',
    tr: 'İstek, işlem için geçerli kimlik doğrulama kimlik bilgilerine sahip değil'
  },

  // Resource and System Errors
  'resource-exhausted': {
    en: 'Some resource has been exhausted, perhaps a per-user quota, or perhaps the entire file system is out of space',
    tr: 'Bazı kaynaklar tükendi, belki kullanıcı başına kota veya belki tüm dosya sistemi yer kalmadı'
  },
  'failed-precondition': {
    en: 'Operation was rejected because the system is not in a state required for the operation\'s execution',
    tr: 'İşlem reddedildi çünkü sistem, işlemin yürütülmesi için gerekli durumda değil'
  },
  'aborted': {
    en: 'The operation was aborted, typically due to a concurrency issue like transaction aborts',
    tr: 'İşlem iptal edildi, genellikle işlem iptalleri gibi eşzamanlılık sorunları nedeniyle'
  },
  'out-of-range': {
    en: 'Operation was attempted past the valid range',
    tr: 'İşlem geçerli aralığın ötesinde denendi'
  },

  // Implementation and Service Errors
  'unimplemented': {
    en: 'Operation is not implemented or not supported/enabled in this service',
    tr: 'İşlem uygulanmadı veya bu hizmette desteklenmiyor/etkin değil'
  },
  'internal': {
    en: 'Internal errors. Some invariants expected by underlying system has been broken',
    tr: 'Dahili hatalar. Temel sistem tarafından beklenen bazı değişmezler bozuldu'
  },
  'unavailable': {
    en: 'The service is currently unavailable. This is most likely a transient condition',
    tr: 'Hizmet şu anda kullanılamıyor. Bu büyük olasılıkla geçici bir durum'
  },
  'data-loss': {
    en: 'Unrecoverable data loss or corruption',
    tr: 'Kurtarılamaz veri kaybı veya bozulması'
  },

  // Firestore-specific prefixed errors
  'firestore/cancelled': {
    en: 'The operation was cancelled',
    tr: 'İşlem iptal edildi'
  },
  'firestore/unknown': {
    en: 'Unknown error or an error from a different error domain',
    tr: 'Bilinmeyen hata veya farklı bir hata etki alanından gelen hata'
  },
  'firestore/invalid-argument': {
    en: 'Client specified an invalid argument',
    tr: 'İstemci geçersiz bir argüman belirtti'
  },
  'firestore/deadline-exceeded': {
    en: 'Deadline expired before operation could complete',
    tr: 'İşlem tamamlanmadan son tarih doldu'
  },
  'firestore/not-found': {
    en: 'Some requested document was not found',
    tr: 'İstenen bazı dokümanlar bulunamadı'
  },
  'firestore/already-exists': {
    en: 'Some document that we attempted to create already exists',
    tr: 'Oluşturmaya çalıştığımız bazı dokümanlar zaten mevcut'
  },
  'firestore/permission-denied': {
    en: 'The caller does not have permission to execute the specified operation',
    tr: 'Arayan, belirtilen işlemi yürütme iznine sahip değil'
  },
  'firestore/unauthenticated': {
    en: 'The request does not have valid authentication credentials for the operation',
    tr: 'İstek, işlem için geçerli kimlik doğrulama kimlik bilgilerine sahip değil'
  },
  'firestore/resource-exhausted': {
    en: 'Some resource has been exhausted, perhaps a per-user quota, or perhaps the entire file system is out of space',
    tr: 'Bazı kaynaklar tükendi, belki kullanıcı başına kota veya belki tüm dosya sistemi yer kalmadı'
  },
  'firestore/failed-precondition': {
    en: 'Operation was rejected because the system is not in a state required for the operation\'s execution',
    tr: 'İşlem reddedildi çünkü sistem, işlemin yürütülmesi için gerekli durumda değil'
  },
  'firestore/aborted': {
    en: 'The operation was aborted, typically due to a concurrency issue like transaction aborts',
    tr: 'İşlem iptal edildi, genellikle işlem iptalleri gibi eşzamanlılık sorunları nedeniyle'
  },
  'firestore/out-of-range': {
    en: 'Operation was attempted past the valid range',
    tr: 'İşlem geçerli aralığın ötesinde denendi'
  },
  'firestore/unimplemented': {
    en: 'Operation is not implemented or not supported/enabled in this service',
    tr: 'İşlem uygulanmadı veya bu hizmette desteklenmiyor/etkin değil'
  },
  'firestore/internal': {
    en: 'Internal errors. Some invariants expected by underlying system has been broken',
    tr: 'Dahili hatalar. Temel sistem tarafından beklenen bazı değişmezler bozuldu'
  },
  'firestore/unavailable': {
    en: 'The service is currently unavailable. This is most likely a transient condition',
    tr: 'Hizmet şu anda kullanılamıyor. Bu büyük olasılıkla geçici bir durum'
  },
  'firestore/data-loss': {
    en: 'Unrecoverable data loss or corruption',
    tr: 'Kurtarılamaz veri kaybı veya bozulması'
  }
};

// ===== UTILITY FUNCTIONS =====

/**
 * Extracts error code from Firebase error object or string
 */
function extractErrorCode(error: any): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.code) {
    return error.code;
  }

  if (error?.message) {
    // Try to extract code from message like "auth/invalid-email"
    const match = error.message.match(/^([a-z-]+\/[a-z-]+)/);
    if (match) {
      return match[1];
    }
  }

  return 'unknown';
}

/**
 * Check if error code matches a pattern (partial matching)
 */
function checkErrorPattern(errorCode: string, pattern: string): boolean {
  return errorCode.toLowerCase().includes(pattern.toLowerCase());
}

/**
 * Get Firebase Authentication error message in specified language
 */
export function getAuthErrorMessage(error: any, lang: 'en' | 'tr' = 'tr'): string {
  const errorCode = extractErrorCode(error);

  // Direct lookup
  if (authErrorMessages[errorCode]) {
    return authErrorMessages[errorCode][lang];
  }

  // Pattern matching for common cases
  const patterns = [
    { pattern: 'user-not-found', key: 'auth/user-not-found' },
    { pattern: 'wrong-password', key: 'auth/wrong-password' },
    { pattern: 'invalid-email', key: 'auth/invalid-email' },
    { pattern: 'email-already', key: 'auth/email-already-in-use' },
    { pattern: 'weak-password', key: 'auth/weak-password' },
    { pattern: 'too-many-requests', key: 'auth/too-many-requests' },
    { pattern: 'network-request-failed', key: 'auth/network-request-failed' },
    { pattern: 'invalid-credential', key: 'auth/invalid-credential' },
    { pattern: 'popup-closed', key: 'auth/popup-closed-by-user' },
    { pattern: 'popup-blocked', key: 'auth/popup-blocked' },
    { pattern: 'requires-recent-login', key: 'auth/requires-recent-login' }
  ];

  for (const { pattern, key } of patterns) {
    if (checkErrorPattern(errorCode, pattern) && authErrorMessages[key]) {
      return authErrorMessages[key][lang];
    }
  }

  // Fallback messages
  const fallbackMessages = {
    en: 'An authentication error occurred. Please try again.',
    tr: 'Bir kimlik doğrulama hatası oluştu. Lütfen tekrar deneyin.'
  };

  return fallbackMessages[lang];
}

/**
 * Get Firebase Storage error message in specified language
 */
export function getStorageErrorMessage(error: any, lang: 'en' | 'tr' = 'tr'): string {
  const errorCode = extractErrorCode(error);

  // Direct lookup
  if (storageErrorMessages[errorCode]) {
    return storageErrorMessages[errorCode][lang];
  }

  // Remove storage/ prefix if present and try again
  const cleanCode = errorCode.replace('storage/', '');
  const storageKey = `storage/${cleanCode}`;
  if (storageErrorMessages[storageKey]) {
    return storageErrorMessages[storageKey][lang];
  }

  // Pattern matching for common cases
  const patterns = [
    { pattern: 'object-not-found', key: 'storage/object-not-found' },
    { pattern: 'unauthorized', key: 'storage/unauthorized' },
    { pattern: 'unauthenticated', key: 'storage/unauthenticated' },
    { pattern: 'quota-exceeded', key: 'storage/quota-exceeded' },
    { pattern: 'bucket-not-found', key: 'storage/bucket-not-found' },
    { pattern: 'invalid-url', key: 'storage/invalid-url' },
    { pattern: 'canceled', key: 'storage/canceled' },
    { pattern: 'retry-limit', key: 'storage/retry-limit-exceeded' }
  ];

  for (const { pattern, key } of patterns) {
    if (checkErrorPattern(errorCode, pattern) && storageErrorMessages[key]) {
      return storageErrorMessages[key][lang];
    }
  }

  // Fallback messages
  const fallbackMessages = {
    en: 'A storage error occurred. Please try again.',
    tr: 'Bir depolama hatası oluştu. Lütfen tekrar deneyin.'
  };

  return fallbackMessages[lang];
}

/**
 * Get Firebase Firestore error message in specified language
 */
export function getFirestoreErrorMessage(error: any, lang: 'en' | 'tr' = 'tr'): string {
  const errorCode = extractErrorCode(error);

  // Direct lookup
  if (firestoreErrorMessages[errorCode]) {
    return firestoreErrorMessages[errorCode][lang];
  }

  // Try with firestore/ prefix
  const firestoreKey = `firestore/${errorCode}`;
  if (firestoreErrorMessages[firestoreKey]) {
    return firestoreErrorMessages[firestoreKey][lang];
  }

  // Remove firestore/ prefix if present and try again
  const cleanCode = errorCode.replace('firestore/', '');
  if (firestoreErrorMessages[cleanCode]) {
    return firestoreErrorMessages[cleanCode][lang];
  }

  // Pattern matching for common cases
  const patterns = [
    { pattern: 'permission-denied', key: 'permission-denied' },
    { pattern: 'unauthenticated', key: 'unauthenticated' },
    { pattern: 'not-found', key: 'not-found' },
    { pattern: 'already-exists', key: 'already-exists' },
    { pattern: 'invalid-argument', key: 'invalid-argument' },
    { pattern: 'deadline-exceeded', key: 'deadline-exceeded' },
    { pattern: 'resource-exhausted', key: 'resource-exhausted' },
    { pattern: 'failed-precondition', key: 'failed-precondition' },
    { pattern: 'aborted', key: 'aborted' },
    { pattern: 'unavailable', key: 'unavailable' },
    { pattern: 'internal', key: 'internal' },
    { pattern: 'cancelled', key: 'cancelled' }
  ];

  for (const { pattern, key } of patterns) {
    if (checkErrorPattern(errorCode, pattern) && firestoreErrorMessages[key]) {
      return firestoreErrorMessages[key][lang];
    }
  }

  // Fallback messages
  const fallbackMessages = {
    en: 'A database error occurred. Please try again.',
    tr: 'Bir veritabanı hatası oluştu. Lütfen tekrar deneyin.'
  };

  return fallbackMessages[lang];
}

/**
 * Universal Firebase error message handler
 * Detects the service based on error code and returns appropriate message
 */
export function getFirebaseErrorMessage(error: any, lang: 'en' | 'tr' = 'tr'): string {
  const errorCode = extractErrorCode(error);

  // Determine service based on error code prefix
  if (errorCode.startsWith('auth/')) {
    return getAuthErrorMessage(error, lang);
  }

  if (errorCode.startsWith('storage/')) {
    return getStorageErrorMessage(error, lang);
  }

  if (errorCode.startsWith('firestore/') ||
    ['cancelled', 'unknown', 'invalid-argument', 'deadline-exceeded', 'not-found',
      'already-exists', 'permission-denied', 'unauthenticated', 'resource-exhausted',
      'failed-precondition', 'aborted', 'out-of-range', 'unimplemented',
      'internal', 'unavailable', 'data-loss'].includes(errorCode)) {
    return getFirestoreErrorMessage(error, lang);
  }

  // Try all services if no prefix detected
  const authMessage = getAuthErrorMessage(error, lang);
  if (!authMessage.includes('kimlik doğrulama hatası') && !authMessage.includes('authentication error')) {
    return authMessage;
  }

  const storageMessage = getStorageErrorMessage(error, lang);
  if (!storageMessage.includes('depolama hatası') && !storageMessage.includes('storage error')) {
    return storageMessage;
  }

  const firestoreMessage = getFirestoreErrorMessage(error, lang);
  if (!firestoreMessage.includes('veritabanı hatası') && !firestoreMessage.includes('database error')) {
    return firestoreMessage;
  }

  // Ultimate fallback
  const fallbackMessages = {
    en: 'An error occurred. Please try again.',
    tr: 'Bir hata oluştu. Lütfen tekrar deneyin.'
  };

  return fallbackMessages[lang];
}
