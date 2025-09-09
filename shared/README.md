# Firebase Auth Error Messages - Shared Package

A centralized Firebase authentication error message system providing consistent Turkish error messages across all projects in the Electro Expert monorepo.

## 📦 Package Contents

- **Error Message Mapping**: Complete mapping of Firebase auth error codes to user-friendly Turkish messages
- **Utility Functions**: Helper functions for error message retrieval and pattern matching
- **TypeScript Support**: Full type safety and IntelliSense support
- **Monorepo Ready**: Designed for use across web, functions, and future packages

## 🚀 Quick Start

### Installation

The shared package is already configured in the monorepo. Simply import what you need:

```typescript
import {
  getAuthErrorMessage,
  authErrorMessages,
  checkErrorPattern,
} from '@/shared-generated'
```

### Basic Usage

```typescript
// Get Turkish error message for any Firebase auth error
const message = getAuthErrorMessage(error.code)

// With custom fallback
const message = getAuthErrorMessage(error.code, 'Özel hata mesajı')

// Check error patterns
if (checkErrorPattern(error.code, ['network', 'timeout'])) {
  // Handle network-related errors
}
```

## 📖 API Reference

### `getAuthErrorMessage(errorCode, fallbackMessage?)`

Returns a localized Turkish error message for Firebase auth errors.

**Parameters:**

- `errorCode` (string): Firebase error code (with or without 'auth/' prefix)
- `fallbackMessage` (string, optional): Custom fallback if error code not found

**Returns:** Turkish error message string

**Examples:**

```typescript
getAuthErrorMessage('auth/user-not-found')
// Returns: "Bu e-posta adresi ile kayıtlı hesap bulunamadı"

getAuthErrorMessage('auth/weak-password')
// Returns: "Şifre çok zayıf, en az 6 karakter olmalı"

getAuthErrorMessage('unknown-error', 'Varsayılan mesaj')
// Returns: "Varsayılan mesaj"
```

### `authErrorMessages`

The complete mapping object containing all error codes and their Turkish translations.

```typescript
const allMessages = authErrorMessages
console.log(allMessages['auth/invalid-email'])
// Output: "Geçersiz e-posta adresi"
```

### `checkErrorPattern(error, patterns)`

Utility function to check if an error contains specific patterns.

**Parameters:**

- `error` (string): Error message or code to check
- `patterns` (string[]): Array of patterns to search for

**Returns:** Boolean indicating if any pattern matches

**Example:**

```typescript
checkErrorPattern('auth/network-request-failed', ['network', 'connection'])
// Returns: true
```

## 🎯 Supported Error Codes

### Authentication Errors

| Error Code                  | Turkish Message                                |
| --------------------------- | ---------------------------------------------- |
| `auth/user-not-found`       | Bu e-posta adresi ile kayıtlı hesap bulunamadı |
| `auth/wrong-password`       | Hatalı şifre                                   |
| `auth/invalid-email`        | Geçersiz e-posta adresi                        |
| `auth/email-already-in-use` | Bu e-posta adresi zaten kullanımda             |
| `auth/weak-password`        | Şifre çok zayıf, en az 6 karakter olmalı       |

### Account Management

| Error Code                   | Turkish Message                                              |
| ---------------------------- | ------------------------------------------------------------ |
| `auth/user-disabled`         | Bu hesap devre dışı bırakılmış                               |
| `auth/too-many-requests`     | Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin |
| `auth/requires-recent-login` | Bu işlem için yeniden giriş yapmanız gerekiyor               |

### Network & System

| Error Code                    | Turkish Message                                          |
| ----------------------------- | -------------------------------------------------------- |
| `auth/network-request-failed` | Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin |
| `auth/timeout`                | İşlem zaman aşımına uğradı. Lütfen tekrar deneyin        |
| `auth/internal-error`         | Dahili hata oluştu. Lütfen tekrar deneyin                |

### Google Sign-in

| Error Code                     | Turkish Message                                      |
| ------------------------------ | ---------------------------------------------------- |
| `auth/popup-closed-by-user`    | Giriş penceresi kapatıldı                            |
| `auth/popup-blocked`           | Popup engellendi. Tarayıcı ayarlarınızı kontrol edin |
| `auth/cancelled-popup-request` | Giriş işlemi iptal edildi                            |

### Phone Authentication

| Error Code                  | Turkish Message           |
| --------------------------- | ------------------------- |
| `auth/invalid-phone-number` | Geçersiz telefon numarası |
| `auth/missing-phone-number` | Telefon numarası gerekli  |
| `auth/quota-exceeded`       | SMS kotası aşıldı         |

_And many more... See the complete list in the source code._

## 🏗️ Package Usage

### Web Package (React)

```typescript
import { getAuthErrorMessage } from '@/shared-generated'

// In components
const handleLogin = async data => {
  try {
    const result = await authService.login(data)
    if (!result.success) {
      setError('root', {
        message: getAuthErrorMessage(result.error || 'default'),
      })
    }
  } catch (error: any) {
    setError('root', {
      message: getAuthErrorMessage(error.code || 'default'),
    })
  }
}
```

### Functions Package (Cloud Functions)

```typescript
import { getAuthErrorMessage } from '@/shared-generated'

export const authFunction = onCall(async request => {
  try {
    // Auth operation
    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: getAuthErrorMessage(error.code || 'default'),
    }
  }
})
```

### Future Packages

Any new package in the monorepo can immediately use the shared error messages:

```typescript
import { getAuthErrorMessage } from '@/shared-generated'
// Ready to use consistent Turkish error messages
```

## 📁 File Structure

```
shared/src/configs/
├── auth-error-messages.ts          # Main error messages file
├── auth-error-messages.md          # Detailed documentation
├── monorepo-usage-examples.md      # Usage examples across packages
├── constants.ts                    # Other constants
└── index.ts                        # Config exports
```

## 🔄 Migration from Local Implementation

If you previously had local error message handling:

### Before

```typescript
// In any package
if (result.error?.includes('user-not-found')) {
  setError('email', {
    message: 'Bu e-posta adresi ile kayıtlı hesap bulunamadı',
  })
}
```

### After

```typescript
import { getAuthErrorMessage } from '@/shared-generated'

if (result.error?.includes('user-not-found')) {
  setError('email', {
    message: getAuthErrorMessage('auth/user-not-found'),
  })
}
```

## 🧪 Testing

Build and test the shared package:

```bash
# Build shared package
cd shared && npm run build

# Test in web package
cd ../web && npm run dev

# Test in functions package
cd ../functions && npm run build
```

## 🤝 Contributing

To add new error messages:

1. Add the error code and Turkish message to `authErrorMessages` in `auth-error-messages.ts`
2. Build the shared package: `npm run build`
3. Test across consuming packages
4. Update documentation as needed

## 📋 Benefits

- ✅ **Consistency**: Same Turkish messages across all packages
- ✅ **Maintainability**: Single source of truth for auth errors
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Performance**: No runtime overhead
- ✅ **Extensibility**: Easy to add new error codes
- ✅ **Monorepo Ready**: Works with existing and future packages

## 📚 Additional Resources

- [Detailed Documentation](./auth-error-messages.md)
- [Monorepo Usage Examples](./monorepo-usage-examples.md)
- [Firebase Auth Error Codes Reference](https://firebase.google.com/docs/auth/admin/errors)

---

**Made with ❤️ for the Electro Expert monorepo**
