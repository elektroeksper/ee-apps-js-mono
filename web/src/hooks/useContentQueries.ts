import { contentService } from '@/services/content.service';
import {
  IServiceItem,
  ISliderItem
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
    mutationFn: contentService.addSliderItem,
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
    mutationFn: contentService.deleteSliderItem,
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
    mutationFn: contentService.addService,
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
    mutationFn: contentService.deleteService,
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
    mutationFn: contentService.updateContactInfo,
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
    mutationFn: contentService.updateAboutInfo,
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
    mutationFn: contentService.updateBrandingInfo,
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
