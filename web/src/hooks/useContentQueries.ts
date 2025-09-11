import { contentService } from '@/services/content.service';
import {
  IAboutInfo,
  IBrandingInfo,
  IContactInfo,
  IServiceItem,
  ISliderItem,
  IVideoItem,
  VideoLocation
} from '@/shared-generated';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// Query Keys
export const contentQueryKeys = {
  sliders: ['content', 'sliders'] as const,
  services: ['content', 'services'] as const,
  contact: ['content', 'contact'] as const,
  about: ['content', 'about'] as const,
  branding: ['content', 'branding'] as const,
  videos: ['content', 'videos'] as const,
  videosByLocation: (location: VideoLocation) => ['content', 'videos', location] as const,
  videoSettings: ['content', 'video-settings'] as const,
};

// Slider Hooks
export const useSliders = () => {
  return useQuery({
    queryKey: contentQueryKeys.sliders,
    queryFn: async () => {
      const result = await contentService.getSliderItems();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch sliders');
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateSliderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (item: Omit<ISliderItem, 'id' | 'createdAt' | 'updatedAt'>) =>
      contentService.addSliderItem(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentQueryKeys.sliders });
      toast.success('Slider created successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to create slider:', error);
      toast.error('Failed to create slider');
    },
  });
};

export const useUpdateSliderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ISliderItem> }) =>
      contentService.updateSliderItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentQueryKeys.sliders });
      toast.success('Slider updated successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to update slider:', error);
      toast.error('Failed to update slider');
    },
  });
};

export const useDeleteSliderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contentService.deleteSliderItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentQueryKeys.sliders });
      toast.success('Slider deleted successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to delete slider:', error);
      toast.error('Failed to delete slider');
    },
  });
};

// Service Hooks
export const useServices = () => {
  return useQuery({
    queryKey: contentQueryKeys.services,
    queryFn: async () => {
      const result = await contentService.getServices();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch services');
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateServiceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (service: Omit<IServiceItem, 'id' | 'createdAt' | 'updatedAt'>) =>
      contentService.addService(service),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentQueryKeys.services });
      toast.success('Service created successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to create service:', error);
      toast.error('Failed to create service');
    },
  });
};

export const useUpdateServiceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IServiceItem> }) =>
      contentService.updateService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentQueryKeys.services });
      toast.success('Service updated successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to update service:', error);
      toast.error('Failed to update service');
    },
  });
};

export const useDeleteServiceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contentService.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentQueryKeys.services });
      toast.success('Service deleted successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to delete service:', error);
      toast.error('Failed to delete service');
    },
  });
};

// Contact Hooks
export const useContact = () => {
  return useQuery({
    queryKey: contentQueryKeys.contact,
    queryFn: async () => {
      const result = await contentService.getContactInfo();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch contact info');
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateContactMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (info: IContactInfo) => contentService.updateContactInfo(info),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentQueryKeys.contact });
      toast.success('Contact information updated successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to update contact:', error);
      toast.error('Failed to update contact information');
    },
  });
};

// About Hooks
export const useAbout = () => {
  return useQuery({
    queryKey: contentQueryKeys.about,
    queryFn: async () => {
      const result = await contentService.getAboutInfo();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch about info');
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateAboutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (info: IAboutInfo) => contentService.updateAboutInfo(info),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentQueryKeys.about });
      toast.success('About information updated successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to update about:', error);
      toast.error('Failed to update about information');
    },
  });
};

// Branding Hooks
export const useBranding = () => {
  return useQuery({
    queryKey: contentQueryKeys.branding,
    queryFn: async () => {
      const result = await contentService.getBrandingInfo();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch branding info');
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateBrandingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (info: IBrandingInfo) => contentService.updateBrandingInfo(info),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentQueryKeys.branding });
      toast.success('Branding information updated successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to update branding:', error);
      toast.error('Failed to update branding information');
    },
  });
};

// Video Hooks
export const useVideos = () => {
  return useQuery({
    queryKey: contentQueryKeys.videos,
    queryFn: async () => {
      const result = await contentService.getVideos();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch videos');
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useVideosByLocation = (location: VideoLocation) => {
  return useQuery({
    queryKey: contentQueryKeys.videosByLocation(location),
    queryFn: async () => {
      const result = await contentService.getVideosByLocation(location);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch videos');
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateVideoMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (video: Omit<IVideoItem, 'id' | 'createdAt' | 'updatedAt'>) =>
      contentService.addVideo(video),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentQueryKeys.videos });
      // Also invalidate location-specific queries
      Object.keys(contentQueryKeys).forEach(key => {
        if (key.startsWith('videosByLocation')) {
          queryClient.invalidateQueries({ queryKey: [key] });
        }
      });
      toast.success('Video created successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to create video:', error);
      toast.error('Failed to create video');
    },
  });
};

export const useUpdateVideoMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IVideoItem> }) =>
      contentService.updateVideo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentQueryKeys.videos });
      // Also invalidate location-specific queries
      Object.keys(contentQueryKeys).forEach(key => {
        if (key.startsWith('videosByLocation')) {
          queryClient.invalidateQueries({ queryKey: [key] });
        }
      });
      toast.success('Video updated successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to update video:', error);
      toast.error('Failed to update video');
    },
  });
};

export const useDeleteVideoMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contentService.deleteVideo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentQueryKeys.videos });
      // Also invalidate location-specific queries
      Object.keys(contentQueryKeys).forEach(key => {
        if (key.startsWith('videosByLocation')) {
          queryClient.invalidateQueries({ queryKey: [key] });
        }
      });
      toast.success('Video deleted successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to delete video:', error);
      toast.error('Failed to delete video');
    },
  });
};

export const useVideoSettings = () => {
  return useQuery({
    queryKey: contentQueryKeys.videoSettings,
    queryFn: async () => {
      const result = await contentService.getVideoSettings();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch video settings');
      }
      return result.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateVideoSettingsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ location, settings }: { location: VideoLocation; settings: any }) =>
      contentService.updateVideoSettings(location, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentQueryKeys.videoSettings });
      toast.success('Video settings updated successfully');
    },
    onError: (error) => {
      console.error('❌ Failed to update video settings:', error);
      toast.error('Failed to update video settings');
    },
  });
};
