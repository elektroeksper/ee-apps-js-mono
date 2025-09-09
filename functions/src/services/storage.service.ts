import { getStorage } from 'firebase-admin/storage';
import { UserDocument, UserDocumentCategory, UserDocumentFileType } from '../shared-generated';

// Initialize Firebase Admin Storage (bucket configured in firebase-admin.ts)
const storage = getStorage();

/**
 * Get file type based on extension
 */
function getFileType(fileName: string): UserDocumentFileType {
  const extension = fileName.toLowerCase().split('.').pop();

  if (extension === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension || '')) return 'image';
  return 'other';
}

/**
 * Get document category based on folder path
 */
function getDocumentCategory(fullPath: string): UserDocumentCategory {
  if (fullPath.includes('business-documents')) return 'business-documents';
  if (fullPath.includes('taxCertificates')) return 'tax-certificates';
  if (fullPath.includes('placePhotos')) return 'place-photos';
  if (fullPath.includes('identity-documents')) return 'identity-documents';
  return 'other';
}

/**
 * Get a user-friendly name for document categories
 */
export function getCategoryDisplayName(category: UserDocumentCategory): string {
  switch (category) {
    case 'business-documents':
      return 'İşletme Belgeleri';
    case 'tax-certificates':
      return 'Vergi Belgeleri';
    case 'place-photos':
      return 'İşyeri Fotoğrafları';
    case 'identity-documents':
      return 'Kimlik Belgeleri';
    default:
      return 'Diğer Belgeler';
  }
}

/**
 * Get file display name (remove extensions and format nicely)
 */
export function getFileDisplayName(fileName: string): string {
  // Remove extension
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');

  // Replace common patterns with readable names
  const patterns = [
    { pattern: /trade.?registry/i, replacement: 'Ticaret Sicil Belgesi' },
    { pattern: /tax.?certificate/i, replacement: 'Vergi Levhası' },
    { pattern: /identity/i, replacement: 'Kimlik Belgesi' },
    { pattern: /license/i, replacement: 'Ruhsat Belgesi' },
    { pattern: /authority/i, replacement: 'Yetki Belgesi' },
    { pattern: /photo/i, replacement: 'Fotoğraf' },
    { pattern: /document/i, replacement: 'Belge' }
  ];

  for (const { pattern, replacement } of patterns) {
    if (pattern.test(nameWithoutExt)) {
      return replacement;
    }
  }

  // If no pattern matches, return formatted filename
  return nameWithoutExt
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

/**
 * Fetch all documents for a specific user from Firebase Storage
 * This function runs in the Firebase Functions environment
 */
export async function getUserDocuments(userId: string): Promise<UserDocument[]> {
  try {
    const documents: UserDocument[] = [];
    const bucket = storage.bucket(); // Use default bucket (configured in firebase-admin.ts)

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
    ];

    // Check each folder for documents
    for (const folderPath of documentFolders) {
      try {
        console.log(`Checking folder: ${folderPath}`);

        // List files in the folder
        const [files] = await bucket.getFiles({ prefix: folderPath });

        for (const file of files) {
          try {
            // Skip directories (files that end with '/')
            if (file.name.endsWith('/')) {
              continue;
            }

            // Skip if we already have this file (avoid duplicates)
            if (documents.some(doc => doc.fullPath === file.name)) {
              continue;
            }

            // For Firebase Admin, we'll use a public download URL instead of signed URL
            const fileName = file.name.split('/').pop() || file.name;
            console.log(`Processing file: ${file.name}, fileName: ${fileName}`);

            let fileUrl: string;
            try {
              // Import getDownloadURL from firebase-admin/storage
              const { getDownloadURL } = await import('firebase-admin/storage');

              // Use Firebase Admin's getDownloadURL function
              fileUrl = await getDownloadURL(file);
              console.log(`Generated download URL for ${fileName}: ${fileUrl.substring(0, 150)}...`);
            } catch (downloadUrlError) {
              console.warn(`Failed to generate download URL for ${fileName}:`, downloadUrlError);
              try {
                // Fallback: Get the file metadata to access the download token manually
                const [metadata] = await file.getMetadata();
                const token = metadata.metadata?.firebaseStorageDownloadTokens;

                if (token) {
                  // Use the download URL with token
                  fileUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media&token=${token}`;
                  console.log(`Generated download URL with token for ${fileName}`);
                } else {
                  throw new Error('No download token found');
                }
              } catch (tokenError) {
                console.warn(`Failed to get download token for ${fileName}:`, tokenError);
                try {
                  // Last fallback: signed URL
                  const [signedUrl] = await file.getSignedUrl({
                    action: 'read',
                    expires: Date.now() + 2 * 60 * 60 * 1000, // 2 hours from now
                    version: 'v4',
                  });
                  fileUrl = signedUrl;
                  console.log(`Generated signed URL as final fallback for ${fileName}`);
                } catch (signedUrlError) {
                  console.warn(`All URL generation methods failed for ${fileName}:`, signedUrlError);
                  // Last resort: basic media URL
                  fileUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media`;
                }
              }
            }

            documents.push({
              name: fileName,
              url: fileUrl,
              type: getFileType(fileName),
              fullPath: file.name,
              category: getDocumentCategory(file.name)
            });
            console.log(`Added document: ${fileName} with URL: ${fileUrl.substring(0, 100)}...`);
          } catch (error) {
            console.warn(`Failed to process file ${file.name}:`, error);
          }
        }
      } catch (error) {
        // Not all folders will exist, so this is expected
        console.debug(`Folder ${folderPath} not found or inaccessible:`, error);
      }
    }

    console.log(`Found ${documents.length} documents for user ${userId}:`, documents.map(d => d.name));
    return documents;
  } catch (error) {
    console.error('Error fetching user documents:', error);
    throw new Error(`Failed to fetch user documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload a document to Firebase Storage
 */
export async function uploadUserDocument(
  userId: string,
  fileName: string,
  category: UserDocumentCategory,
  fileData: string,
  metadata?: any
): Promise<UserDocument> {
  try {
    const bucket = storage.bucket(); // Use default bucket (configured in firebase-admin.ts)

    // Generate file path based on category and user ID
    let filePath: string;
    switch (category) {
      case 'business-documents':
        filePath = `business-documents/${userId}/${fileName}`;
        break;
      case 'tax-certificates':
        filePath = `taxCertificates/${userId}/${fileName}`;
        break;
      case 'place-photos':
        filePath = `placePhotos/${userId}/${fileName}`;
        break;
      case 'identity-documents':
        filePath = `identity-documents/${userId}/${fileName}`;
        break;
      default:
        filePath = `other/${userId}/${fileName}`;
        break;
    }

    console.log(`Uploading file to: ${filePath}`);

    // Convert base64 data to buffer
    const base64Data = fileData.includes(',') ? fileData.split(',')[1] : fileData;
    const fileBuffer = Buffer.from(base64Data, 'base64');

    // Get file reference
    const file = bucket.file(filePath);

    // Upload the file
    await file.save(fileBuffer, {
      metadata: {
        contentType: getContentType(fileName),
        metadata: {
          uploadedBy: userId,
          uploadedAt: new Date().toISOString(),
          originalName: fileName,
          category,
          ...metadata
        }
      }
    });

    console.log(`File uploaded successfully: ${filePath}`);

    // Create a public download URL instead of signed URL
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media`;

    // Return the UserDocument object
    const userDocument: UserDocument = {
      name: fileName,
      url: publicUrl,
      type: getFileType(fileName),
      fullPath: filePath,
      category,
      uploadedAt: new Date().toISOString(),
      size: fileBuffer.length,
      metadata: {
        uploadedBy: userId,
        originalName: fileName,
        ...metadata
      }
    };

    console.log(`Document created successfully:`, userDocument);
    return userDocument;

  } catch (error) {
    console.error('Error uploading document:', error);
    throw new Error(`Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get content type based on file extension
 */
function getContentType(fileName: string): string {
  const extension = fileName.toLowerCase().split('.').pop();
  switch (extension) {
    case 'pdf':
      return 'application/pdf';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'bmp':
      return 'image/bmp';
    default:
      return 'application/octet-stream';
  }
}
