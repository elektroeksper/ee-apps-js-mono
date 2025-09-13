// Content Management types for the admin panel

export type ContentSection =
  | 'hero'
  | 'services'
  | 'about'
  | 'contact'
  | 'slider'
  | 'branding'
  | 'videos';

export interface ISliderItem {
  id?: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl: string;
  buttonText?: string;
  buttonLink?: string;
  order: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IServiceItem {
  id?: string;
  title: string;
  description: string;
  icon?: string;
  imageUrl?: string;
  features?: string[];
  order: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IContactInfo {
  phone: string;
  email: string;
  address: string;
  workingHours: string;
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    whatsapp?: string;
  };
  mapUrl?: string;
  updatedAt?: Date;
}

export interface IAboutInfo {
  mdContent: string;
  updatedAt?: Date;
  updatedBy: string;
}

export interface IBrandingInfo {
  logoUrl: string;
  logoAltText: string;
  faviconUrl?: string;
  brandColors: {
    primary: string;
    secondary: string;
    accent?: string;
  };
  companyName: string;
  tagline?: string;
  updatedAt?: Date;
}

export type VideoLocation =
  | 'individual-setup'
  | 'business-setup'
  | 'app-index'
  | 'individual-home'
  | 'business-home';

export interface IVideoItem {
  id?: string;
  title?: string; // Auto-fetched from YouTube
  description?: string; // Auto-fetched from YouTube
  youtubeVideoId: string; // Just the video ID, not full URL
  location: VideoLocation;
  autoStart: boolean;
  loop: boolean;
  order: number;
  isActive: boolean;
  thumbnailUrl?: string; // Auto-generated from YouTube
  duration?: number; // In seconds, auto-fetched
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IVideoSettings {
  id?: string;
  location: VideoLocation;
  defaultAutoStart: boolean;
  defaultLoop: boolean;
  maxVideosPerLocation: number;
  updatedAt?: Date;
}

export interface IContentOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Service interfaces
export interface IContentService {
  // Slider
  getSliderItems(): Promise<IContentOperationResult<ISliderItem[]>>;
  addSliderItem(item: Omit<ISliderItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<IContentOperationResult<void>>;
  updateSliderItem(id: string, item: Partial<ISliderItem>): Promise<IContentOperationResult<void>>;
  deleteSliderItem(id: string): Promise<IContentOperationResult<void>>;

  // Services
  getServices(): Promise<IContentOperationResult<IServiceItem[]>>;
  addService(service: Omit<IServiceItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<IContentOperationResult<void>>;
  updateService(id: string, service: Partial<IServiceItem>): Promise<IContentOperationResult<void>>;
  deleteService(id: string): Promise<IContentOperationResult<void>>;

  // Contact
  getContactInfo(): Promise<IContentOperationResult<IContactInfo>>;
  updateContactInfo(info: IContactInfo): Promise<IContentOperationResult<void>>;

  // About
  getAboutInfo(): Promise<IContentOperationResult<IAboutInfo>>;
  updateAboutInfo(info: IAboutInfo): Promise<IContentOperationResult<void>>;

  // Branding
  getBrandingInfo(): Promise<IContentOperationResult<IBrandingInfo>>;
  updateBrandingInfo(info: IBrandingInfo): Promise<IContentOperationResult<void>>;

  // Videos
  getVideos(): Promise<IContentOperationResult<IVideoItem[]>>;
  getVideosByLocation(location: VideoLocation): Promise<IContentOperationResult<IVideoItem[]>>;
  addVideo(video: Omit<IVideoItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<IContentOperationResult<void>>;
  updateVideo(id: string, video: Partial<IVideoItem>): Promise<IContentOperationResult<void>>;
  deleteVideo(id: string): Promise<IContentOperationResult<void>>;

  // Video Settings
  getVideoSettings(): Promise<IContentOperationResult<IVideoSettings[]>>;
  updateVideoSettings(location: VideoLocation, settings: Partial<IVideoSettings>): Promise<IContentOperationResult<void>>;
}
