import { getStorage } from 'firebase-admin/storage'
import { logger } from 'firebase-functions/v2'
import {
  DocumentCategory,
  DocumentFileType,
  IDocument, StorageDocumentStatus, StorageDocumentType
} from '../shared-generated'

// Initialize Firebase Admin Storage (bucket configured in firebase-admin.ts)
const storage = getStorage()

/**
 * Get file type based on extension
 */
function getFileType(fileName: string): DocumentFileType {
  const extension = fileName.toLowerCase().split('.').pop()

  if (extension === 'pdf') return 'pdf'
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension || ''))
    return 'image'
  return 'other'
}

/**
 * Get document category based on folder path and update for new structure
 */
function getDocumentCategory(fullPath: string): DocumentCategory {
  if (fullPath.includes('business-documents')) return 'business-documents'
  if (fullPath.includes('tax-certificates')) return 'tax-certificates'
  if (fullPath.includes('place-photos')) return 'place-photos'
  if (fullPath.includes('identity-documents')) return 'identity-documents'
  if (fullPath.includes('content-uploads')) return 'content-uploads'
  return 'other'
}

/**
 * Get a user-friendly name for document categories (updated for content uploads)
 */
export function getCategoryDisplayName(category: DocumentCategory): string {
  switch (category) {
    case 'business-documents':
      return 'İşletme Belgeleri'
    case 'tax-certificates':
      return 'Vergi Belgeleri'
    case 'place-photos':
      return 'İşyeri Fotoğrafları'
    case 'identity-documents':
      return 'Kimlik Belgeleri'
    case 'content-uploads':
      return 'İçerik Dosyaları'
    default:
      return 'Diğer Belgeler'
  }
}

/**
 * Get file display name (remove extensions and format nicely)
 */
export function getFileDisplayName(fileName: string): string {
  // Remove extension
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '')

  // Replace common patterns with readable names
  const patterns = [
    { pattern: /trade.?registry/i, replacement: 'Ticaret Sicil Belgesi' },
    { pattern: /tax.?certificate/i, replacement: 'Vergi Levhası' },
    { pattern: /identity/i, replacement: 'Kimlik Belgesi' },
    { pattern: /license/i, replacement: 'Ruhsat Belgesi' },
    { pattern: /authority/i, replacement: 'Yetki Belgesi' },
    { pattern: /photo/i, replacement: 'Fotoğraf' },
    { pattern: /document/i, replacement: 'Belge' },
  ]

  for (const { pattern, replacement } of patterns) {
    if (pattern.test(nameWithoutExt)) {
      return replacement
    }
  }

  // If no pattern matches, return formatted filename
  return nameWithoutExt
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
}

/**
 * Fetch all documents for a specific user from Firebase Storage
 * This function runs in the Firebase Functions environment
 */

function inferDocumentTypeByFolderPath(
  folderPath: string
): StorageDocumentType {
  if (folderPath.includes('business-documents'))
    return StorageDocumentType.BUSINESS_LICENSE
  if (folderPath.includes('taxCertificates'))
    return StorageDocumentType.TAX_CERTIFICATE
  if (folderPath.includes('placePhotos')) return StorageDocumentType.OTHER
  if (folderPath.includes('identity-documents'))
    return StorageDocumentType.UTILITY_BILL
  return StorageDocumentType.OTHER
}
export async function getDocuments(userId: string): Promise<IDocument[]> {
  try {
    const documents: IDocument[] = []
    const bucket = storage.bucket() // Use default bucket (configured in firebase-admin.ts)

    // Define the possible document folders for a user
    const documentFolders = [
      `business-documents/${userId}`,
      `business-documents/`, // General business documents folder
      `taxCertificates/${userId}`,
      `taxCertificates/`, // General tax certificates folder
      `placePhotos/${userId}`,
      `placePhotos/`, // General place photos folder
      `identity-documents/${userId}`,
      `identity-documents/`, // General identity documents folder
      userId, // Direct user folder
    ]

    // Check each folder for documents
    for (const folderPath of documentFolders) {
      try {
        logger.info(`Checking folder: ${folderPath}`)
        const documentType: StorageDocumentType =
          inferDocumentTypeByFolderPath(folderPath)

        // List files in the folder
        const [files] = await bucket.getFiles({ prefix: folderPath })

        for (const file of files) {
          try {
            // Skip directories (files that end with '/')
            if (file.name.endsWith('/')) {
              continue
            }

            // Skip if we already have this file (avoid duplicates)
            if (documents.some(doc => doc.fullPath === file.name)) {
              continue
            }

            // For Firebase Admin, we'll use a public download URL instead of signed URL
            const fileName = file.name.split('/').pop() || file.name
            logger.info(`Processing file: ${file.name}, fileName: ${fileName}`)

            let fileUrl: string
            try {
              // Import getDownloadURL from firebase-admin/storage
              const { getDownloadURL } = await import('firebase-admin/storage')

              // Use Firebase Admin's getDownloadURL function
              fileUrl = await getDownloadURL(file)
              logger.info(
                `Generated download URL for ${fileName}: ${fileUrl.substring(0, 150)}...`
              )
            } catch (downloadUrlError) {
              logger.warn(
                `Failed to generate download URL for ${fileName}:`,
                downloadUrlError
              )
              try {
                // Fallback: Get the file metadata to access the download token manually
                const [metadata] = await file.getMetadata()
                const token = metadata.metadata?.firebaseStorageDownloadTokens

                if (token) {
                  // Use the download URL with token
                  fileUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media&token=${token}`
                  logger.info(
                    `Generated download URL with token for ${fileName}`
                  )
                } else {
                  throw new Error('No download token found')
                }
              } catch (tokenError) {
                logger.warn(
                  `Failed to get download token for ${fileName}:`,
                  tokenError
                )
                try {
                  // Last fallback: signed URL
                  const [signedUrl] = await file.getSignedUrl({
                    action: 'read',
                    expires: Date.now() + 2 * 60 * 60 * 1000, // 2 hours from now
                    version: 'v4',
                  })
                  fileUrl = signedUrl
                  logger.info(
                    `Generated signed URL as final fallback for ${fileName}`
                  )
                } catch (signedUrlError) {
                  logger.warn(
                    `All URL generation methods failed for ${fileName}:`,
                    signedUrlError
                  )
                  // Last resort: basic media URL
                  fileUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media`
                }
              }
            }

            documents.push({
              name: fileName,
              type: documentType,
              url: fileUrl,
              fileType: getFileType(fileName),
              fullPath: file.name,
              category: getDocumentCategory(file.name),
              uploadedAt: file.metadata?.timeCreated
                ? new Date(file.metadata.timeCreated)
                : new Date(),
              uploadedBy: '',
              status: StorageDocumentStatus.APPROVED,
            })
            logger.info(
              `Added document: ${fileName} with URL: ${fileUrl.substring(0, 100)}...`
            )
          } catch (error) {
            logger.warn(`Failed to process file ${file.name}:`, error)
          }
        }
      } catch (error) {
        // Not all folders will exist, so this is expected
        logger.debug(`Folder ${folderPath} not found or inaccessible:`, error)
      }
    }

    logger.info(
      `Found ${documents.length} documents for user ${userId}:`,
      documents.map(d => d.name)
    )
    return documents
  } catch (error) {
    logger.error('Error fetching user documents:', error)
    throw new Error(
      `Failed to fetch user documents: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Upload a document to Firebase Storage with UUID naming
 */
export async function uploadDocument(
  userId: string,
  fileName: string,
  category: DocumentCategory,
  fileData: string,
  metadata?: any
): Promise<IDocument> {
  try {
    const bucket = storage.bucket() // Use default bucket (configured in firebase-admin.ts)

    // Generate UUID for file name to avoid conflicts
    const { randomUUID } = await import('crypto')
    const fileExtension = fileName.split('.').pop() || ''
    const uniqueFileName = `${randomUUID()}.${fileExtension}`

    // Generate file path based on category with proper folder structure
    let filePath: string
    switch (category) {
      case 'business-documents':
        filePath = `business-documents/${userId}/${uniqueFileName}`
        break
      case 'tax-certificates':
        filePath = `tax-certificates/${userId}/${uniqueFileName}`
        break
      case 'place-photos':
        filePath = `place-photos/${userId}/${uniqueFileName}`
        break
      case 'identity-documents':
        filePath = `identity-documents/${userId}/${uniqueFileName}`
        break
      case 'content-uploads':
        // For admin content uploads, use category-specific subfolders
        filePath = `content-uploads/${metadata?.subcategory || 'general'}/${uniqueFileName}`
        break
      default:
        filePath = `other/${userId}/${uniqueFileName}`
        break
    }

    logger.info(`Uploading file to: ${filePath}`)

    // Convert base64 data to buffer
    const base64Data = fileData.includes(',')
      ? fileData.split(',')[1]
      : fileData
    const fileBuffer = Buffer.from(base64Data, 'base64')

    // Get file reference
    const file = bucket.file(filePath)

    // Upload the file with metadata
    await file.save(fileBuffer, {
      metadata: {
        contentType: getContentType(fileName),
        metadata: {
          uploadedBy: userId,
          uploadedAt: new Date().toISOString(),
          originalName: fileName,
          category,
          uniqueId: uniqueFileName.split('.')[0], // UUID without extension
          ...metadata,
        },
      },
    })

    logger.info(`File uploaded successfully: ${filePath}`)

    // Generate public download URL
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media`

    // Return the IDocument object
    const document: IDocument = {
      name: fileName, // Keep original name for display
      url: publicUrl,
      fileType: getFileType(fileName),
      fullPath: filePath,
      category,
      uploadedAt: new Date().toISOString(),
      metadata: {
        size: fileBuffer.length,
        uploadedBy: userId,
        originalName: fileName,
        uniqueId: uniqueFileName.split('.')[0],
        ...metadata,
      },
      type: getDocumentTypeFromCategory(category),
      uploadedBy: userId,
      status:
        category === 'content-uploads'
          ? StorageDocumentStatus.APPROVED
          : StorageDocumentStatus.PENDING,
    }

    logger.info(`Document created successfully:`, document)
    return document
  } catch (error) {
    logger.error('Error uploading document:', error)
    throw new Error(
      `Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Validate file for upload based on category
 */
export function validateFile(
  fileName: string,
  fileSize: number,
  category: DocumentCategory
): { valid: boolean; error?: string } {
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (fileSize > maxSize) {
    return { valid: false, error: "Dosya boyutu 10MB'ı geçemez" }
  }

  // Check file type
  const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']
  const extension = fileName.toLowerCase().split('.').pop()
  if (!extension || !allowedExtensions.includes(extension)) {
    return { valid: false, error: 'Desteklenmeyen dosya formatı' }
  }

  // Category-specific validations
  switch (category) {
    case 'business-documents':
    case 'tax-certificates':
    case 'identity-documents':
      // These should preferably be PDFs but images are allowed
      break
    case 'place-photos':
      // These should be images
      if (getFileType(fileName) !== 'image') {
        return {
          valid: false,
          error: 'İşyeri fotoğrafları resim formatında olmalıdır',
        }
      }
      break
    case 'content-uploads':
      // Content uploads should be images for now
      if (getFileType(fileName) !== 'image') {
        return {
          valid: false,
          error: 'İçerik dosyaları resim formatında olmalıdır',
        }
      }
      break
  }

  return { valid: true }
}

/**
 * Get document type based on category
 */
function getDocumentTypeFromCategory(
  category: DocumentCategory
): StorageDocumentType {
  switch (category) {
    case 'business-documents':
      return StorageDocumentType.BUSINESS_LICENSE
    case 'tax-certificates':
      return StorageDocumentType.TAX_CERTIFICATE
    case 'identity-documents':
      return StorageDocumentType.UTILITY_BILL
    case 'place-photos':
    case 'content-uploads':
    default:
      return StorageDocumentType.OTHER
  }
}

/**
 * Get content type based on file extension
 */
function getContentType(fileName: string): string {
  const extension = fileName.toLowerCase().split('.').pop()
  switch (extension) {
    case 'pdf':
      return 'application/pdf'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'gif':
      return 'image/gif'
    case 'webp':
      return 'image/webp'
    case 'bmp':
      return 'image/bmp'
    default:
      return 'application/octet-stream'
  }
}
