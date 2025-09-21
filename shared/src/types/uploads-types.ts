interface IUploadItem {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  category: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface IUploadResponse {
  success: boolean;
  data?: IUploadItem;
  error?: string;
}

interface IUploadListResponse {
  success: boolean;
  data?: IUploadItem[];
  error?: string;
}

interface IUploadsFilter {
  category?: UploadCategory;
  uploadedBy?: string;
  dateFrom?: string; // ISO date string
  dateTo?: string;   // ISO date string
}


type UploadCategory = 'general' | 'sliders' | 'services' | 'branding' | 'content';


interface IUploadService {
  upload(file: File,
    category: UploadCategory,
    authToken?: string): Promise<IUploadResponse>;
  delete(id: string, authToken?: string): Promise<IUploadResponse>;
  getAll(filter: IUploadsFilter): Promise<IUploadListResponse>;
  validate(file: File): { valid: boolean; error?: string };
  getCategoryDisplayName(category: UploadCategory): string;
  fileToBase64(file: File): Promise<string>;
  getExtension(fileName: string): string;
}

export type { IUploadItem, IUploadListResponse, IUploadResponse, IUploadService, IUploadsFilter, UploadCategory };

