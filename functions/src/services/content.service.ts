/**
 * Content Service for Firebase Functions
 * Handles content management operations server-side using Firebase Admin SDK
 */

import { FieldValue } from 'firebase-admin/firestore';
import {
  IAboutInfo,
  IBrandingInfo,
  IContactInfo,
  IContentOperationResult,
  IServiceItem,
  ISliderItem,
  IVideoItem,
  IVideoSettings,
  VideoLocation
} from '../shared-generated';
import { db } from '../utils/firebase-admin';

export class ContentService {
  // Collection references
  private slidersRef = db.collection('sliders');
  private servicesRef = db.collection('services');
  private contentRef = db.collection('content');
  private videosRef = db.collection('videos');
  private videoSettingsRef = db.collection('video-settings');

  // Helper method for error handling
  private handleError(error: any, operation: string): IContentOperationResult<never> {
    console.error(`❌ ${operation} failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Operation failed',
      message: `${operation} operation failed`
    };
  }

  // Video Management
  async getVideos(): Promise<IContentOperationResult<IVideoItem[]>> {
    try {
      console.log('🔍 Fetching all videos...');
      const snapshot = await this.videosRef.orderBy('createdAt', 'desc').get();

      const videos: IVideoItem[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        videos.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        } as IVideoItem);
      });

      console.log(`✅ Fetched ${videos.length} videos`);
      return {
        success: true,
        data: videos,
        message: `Successfully fetched ${videos.length} videos`
      };
    } catch (error: any) {
      return this.handleError(error, 'Get videos');
    }
  }

  async getVideosByLocation(location: VideoLocation): Promise<IContentOperationResult<IVideoItem[]>> {
    try {
      console.log(`🔍 Fetching videos for location: ${location}`);
      const snapshot = await this.videosRef
        .where('location', '==', location)
        .where('isActive', '==', true)
        .orderBy('createdAt', 'desc')
        .get();

      const videos: IVideoItem[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        videos.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        } as IVideoItem);
      });

      console.log(`✅ Fetched ${videos.length} videos for location ${location}`);
      return {
        success: true,
        data: videos,
        message: `Successfully fetched ${videos.length} videos for ${location}`
      };
    } catch (error: any) {
      return this.handleError(error, `Get videos by location ${location}`);
    }
  }

  async addVideo(video: Omit<IVideoItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<IContentOperationResult<IVideoItem>> {
    try {
      console.log('➕ Adding new video...');
      const now = FieldValue.serverTimestamp();
      const docRef = await this.videosRef.add({
        ...video,
        createdAt: now,
        updatedAt: now,
      });

      const savedDoc = await docRef.get();
      const savedData = savedDoc.data();

      const savedVideo: IVideoItem = {
        id: docRef.id,
        ...savedData,
        createdAt: savedData!.createdAt?.toDate?.() || new Date(),
        updatedAt: savedData!.updatedAt?.toDate?.() || new Date(),
      } as IVideoItem;

      console.log(`✅ Video added with ID: ${docRef.id}`);
      return {
        success: true,
        data: savedVideo,
        message: 'Video added successfully'
      };
    } catch (error: any) {
      return this.handleError(error, 'Add video');
    }
  }

  async updateVideo(id: string, updates: Partial<Omit<IVideoItem, 'id' | 'createdAt'>>): Promise<IContentOperationResult<IVideoItem>> {
    try {
      console.log(`🔄 Updating video ${id}...`);
      const docRef = this.videosRef.doc(id);

      await docRef.update({
        ...updates,
        updatedAt: FieldValue.serverTimestamp(),
      });

      const updatedDoc = await docRef.get();
      if (!updatedDoc.exists) {
        throw new Error('Video not found after update');
      }

      const updatedData = updatedDoc.data();
      const updatedVideo: IVideoItem = {
        id: updatedDoc.id,
        ...updatedData,
        createdAt: updatedData!.createdAt?.toDate?.() || new Date(),
        updatedAt: updatedData!.updatedAt?.toDate?.() || new Date(),
      } as IVideoItem;

      console.log(`✅ Video ${id} updated successfully`);
      return {
        success: true,
        data: updatedVideo,
        message: 'Video updated successfully'
      };
    } catch (error: any) {
      return this.handleError(error, `Update video ${id}`);
    }
  }

  async deleteVideo(id: string): Promise<IContentOperationResult<void>> {
    try {
      console.log(`🗑️ Deleting video ${id}...`);
      await this.videosRef.doc(id).delete();

      console.log(`✅ Video ${id} deleted successfully`);
      return {
        success: true,
        message: 'Video deleted successfully'
      };
    } catch (error: any) {
      return this.handleError(error, `Delete video ${id}`);
    }
  }

  // Slider Management
  async getSliderItems(): Promise<IContentOperationResult<ISliderItem[]>> {
    try {
      console.log('🔍 Fetching slider items...');
      const snapshot = await this.slidersRef.orderBy('order', 'asc').get();

      const sliders: ISliderItem[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        sliders.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        } as ISliderItem);
      });

      console.log(`✅ Fetched ${sliders.length} slider items`);
      return {
        success: true,
        data: sliders,
        message: `Successfully fetched ${sliders.length} slider items`
      };
    } catch (error: any) {
      return this.handleError(error, 'Get slider items');
    }
  }

  // Service Management
  async getServices(): Promise<IContentOperationResult<IServiceItem[]>> {
    try {
      console.log('🔍 Fetching services...');
      const snapshot = await this.servicesRef.orderBy('order', 'asc').get();

      const services: IServiceItem[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        services.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        } as IServiceItem);
      });

      console.log(`✅ Fetched ${services.length} services`);
      return {
        success: true,
        data: services,
        message: `Successfully fetched ${services.length} services`
      };
    } catch (error: any) {
      return this.handleError(error, 'Get services');
    }
  }

  // Content Info Management
  async getContactInfo(): Promise<IContentOperationResult<IContactInfo | null>> {
    try {
      console.log('🔍 Fetching contact info...');
      const doc = await this.contentRef.doc('contact').get();

      if (!doc.exists) {
        return {
          success: true,
          data: null,
          message: 'No contact info found'
        };
      }

      const data = doc.data();
      const contactInfo = {
        id: doc.id,
        ...data,
        updatedAt: data!.updatedAt?.toDate?.() || data!.updatedAt,
      } as unknown as IContactInfo;

      console.log('✅ Contact info fetched successfully');
      return {
        success: true,
        data: contactInfo,
        message: 'Contact info fetched successfully'
      };
    } catch (error: any) {
      return this.handleError(error, 'Get contact info');
    }
  }

  async getAboutInfo(): Promise<IContentOperationResult<IAboutInfo | null>> {
    try {
      console.log('🔍 Fetching about info...');
      const doc = await this.contentRef.doc('about').get();

      if (!doc.exists) {
        return {
          success: true,
          data: null,
          message: 'No about info found'
        };
      }

      const data = doc.data();
      const aboutInfo = {
        id: doc.id,
        ...data,
        updatedAt: data!.updatedAt?.toDate?.() || data!.updatedAt,
      } as unknown as IAboutInfo;

      console.log('✅ About info fetched successfully');
      return {
        success: true,
        data: aboutInfo,
        message: 'About info fetched successfully'
      };
    } catch (error: any) {
      return this.handleError(error, 'Get about info');
    }
  }

  async getBrandingInfo(): Promise<IContentOperationResult<IBrandingInfo | null>> {
    try {
      console.log('🔍 Fetching branding info...');
      const doc = await this.contentRef.doc('branding').get();

      if (!doc.exists) {
        return {
          success: true,
          data: null,
          message: 'No branding info found'
        };
      }

      const data = doc.data();
      const brandingInfo = {
        id: doc.id,
        ...data,
        updatedAt: data!.updatedAt?.toDate?.() || data!.updatedAt,
      } as unknown as IBrandingInfo;

      console.log('✅ Branding info fetched successfully');
      return {
        success: true,
        data: brandingInfo,
        message: 'Branding info fetched successfully'
      };
    } catch (error: any) {
      return this.handleError(error, 'Get branding info');
    }
  }

  async getVideoSettings(): Promise<IContentOperationResult<IVideoSettings | null>> {
    try {
      console.log('🔍 Fetching video settings...');
      const doc = await this.videoSettingsRef.doc('global').get();

      if (!doc.exists) {
        return {
          success: true,
          data: null,
          message: 'No video settings found'
        };
      }

      const data = doc.data();
      const settings: IVideoSettings = {
        id: doc.id,
        ...data,
        updatedAt: data!.updatedAt?.toDate?.() || data!.updatedAt,
      } as IVideoSettings;

      console.log('✅ Video settings fetched successfully');
      return {
        success: true,
        data: settings,
        message: 'Video settings fetched successfully'
      };
    } catch (error: any) {
      return this.handleError(error, 'Get video settings');
    }
  }
}

export const contentService = new ContentService();