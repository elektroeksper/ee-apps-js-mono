import { db } from "@/config/firebase";
import {
  IAboutInfo,
  IBrandingInfo,
  IContactInfo,
  IOperationResult as IContentOperationResult,
  IContentService,
  IServiceItem,
  ISliderItem
} from "@/shared-generated";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from "firebase/firestore";

class ContentService implements IContentService {
  private slidersRef = collection(db, 'sliders');
  private servicesRef = collection(db, 'services');
  private contentRef = collection(db, 'content');

  // Helper method for error handling
  private handleError(error: any, operation: string): IContentOperationResult {
    console.error(`❌ ${operation} failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Operation failed',
      details: `${operation} operation failed`
    };
  }

  // Slider Management
  async getSliderItems(): Promise<IContentOperationResult<ISliderItem[]>> {
    try {
      console.log('🔍 Fetching slider items...');
      const q = query(this.slidersRef, orderBy('order', 'asc'));
      const snapshot = await getDocs(q);

      const items: ISliderItem[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      } as ISliderItem));

      console.log('✅ Slider items fetched:', items.length);
      return { success: true, data: items };
    } catch (error) {
      return this.handleError(error, 'Get slider items');
    }
  }

  async addSliderItem(item: Omit<ISliderItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<IContentOperationResult<void>> {
    try {
      console.log('➕ Adding slider item:', item);
      const docData = {
        ...item,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(this.slidersRef, docData);
      console.log('✅ Slider item added successfully');
      return { success: true };
    } catch (error) {
      return this.handleError(error, 'Add slider item');
    }
  }

  async updateSliderItem(id: string, item: Partial<ISliderItem>): Promise<IContentOperationResult<void>> {
    try {
      console.log('📝 Updating slider item:', { id, item });
      const docRef = doc(this.slidersRef, id);
      const updateData = {
        ...item,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(docRef, updateData);
      console.log('✅ Slider item updated successfully');
      return { success: true };
    } catch (error) {
      return this.handleError(error, 'Update slider item');
    }
  }

  async deleteSliderItem(id: string): Promise<IContentOperationResult<void>> {
    try {
      console.log('🗑️ Deleting slider item:', id);
      await deleteDoc(doc(this.slidersRef, id));
      console.log('✅ Slider item deleted successfully');
      return { success: true };
    } catch (error) {
      return this.handleError(error, 'Delete slider item');
    }
  }

  // Services Management
  async getServices(): Promise<IContentOperationResult<IServiceItem[]>> {
    try {
      console.log('🔍 Fetching services...');
      const q = query(this.servicesRef, orderBy('order', 'asc'));
      const snapshot = await getDocs(q);

      const services: IServiceItem[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      } as IServiceItem));

      console.log('✅ Services fetched:', services.length);
      return { success: true, data: services };
    } catch (error) {
      return this.handleError(error, 'Get services');
    }
  }

  async addService(service: Omit<IServiceItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<IContentOperationResult<void>> {
    try {
      console.log('➕ Adding service:', service);
      const docData = {
        ...service,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(this.servicesRef, docData);
      console.log('✅ Service added successfully');
      return { success: true };
    } catch (error) {
      return this.handleError(error, 'Add service');
    }
  }

  async updateService(id: string, service: Partial<IServiceItem>): Promise<IContentOperationResult<void>> {
    try {
      console.log('📝 Updating service:', { id, service });
      const docRef = doc(this.servicesRef, id);
      const updateData = {
        ...service,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(docRef, updateData);
      console.log('✅ Service updated successfully');
      return { success: true };
    } catch (error) {
      return this.handleError(error, 'Update service');
    }
  }

  async deleteService(id: string): Promise<IContentOperationResult<void>> {
    try {
      console.log('🗑️ Deleting service:', id);
      await deleteDoc(doc(this.servicesRef, id));
      console.log('✅ Service deleted successfully');
      return { success: true };
    } catch (error) {
      return this.handleError(error, 'Delete service');
    }
  }

  // Contact Info Management
  async getContactInfo(): Promise<IContentOperationResult<IContactInfo>> {
    try {
      console.log('🔍 Fetching contact info...');
      const docRef = doc(this.contentRef, 'contact');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = {
          ...docSnap.data(),
          updatedAt: docSnap.data().updatedAt?.toDate(),
        } as IContactInfo;

        console.log('✅ Contact info fetched');
        return { success: true, data };
      } else {
        console.log('ℹ️ No contact info found, returning defaults');
        const defaultContact: IContactInfo = {
          phone: '',
          email: '',
          address: '',
          workingHours: '',
          socialMedia: {},
        };
        return { success: true, data: defaultContact };
      }
    } catch (error) {
      return this.handleError(error, 'Get contact info');
    }
  }

  async updateContactInfo(info: IContactInfo): Promise<IContentOperationResult<void>> {
    try {
      console.log('📝 Updating contact info:', info);
      const docRef = doc(this.contentRef, 'contact');
      const updateData = {
        ...info,
        updatedAt: serverTimestamp(),
      };

      await setDoc(docRef, updateData, { merge: true });
      console.log('✅ Contact info updated successfully');
      return { success: true };
    } catch (error) {
      return this.handleError(error, 'Update contact info');
    }
  }

  // About Info Management
  async getAboutInfo(): Promise<IContentOperationResult<IAboutInfo>> {
    try {
      console.log('🔍 Fetching about info...');
      const docRef = doc(this.contentRef, 'about');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = {
          ...docSnap.data(),
          updatedAt: docSnap.data().updatedAt?.toDate(),
        } as IAboutInfo;

        console.log('✅ About info fetched');
        return { success: true, data };
      } else {
        console.log('ℹ️ No about info found, returning defaults');
        const defaultAbout: IAboutInfo = {
          title: '',
          description: '',
          mission: '',
          vision: '',
          values: [],
        };
        return { success: true, data: defaultAbout };
      }
    } catch (error) {
      return this.handleError(error, 'Get about info');
    }
  }

  async updateAboutInfo(info: IAboutInfo): Promise<IContentOperationResult<void>> {
    try {
      console.log('📝 Updating about info:', info);
      const docRef = doc(this.contentRef, 'about');
      const updateData = {
        ...info,
        updatedAt: serverTimestamp(),
      };

      await setDoc(docRef, updateData, { merge: true });
      console.log('✅ About info updated successfully');
      return { success: true };
    } catch (error) {
      return this.handleError(error, 'Update about info');
    }
  }

  // Branding Info Management
  async getBrandingInfo(): Promise<IContentOperationResult<IBrandingInfo>> {
    try {
      console.log('🔍 Fetching branding info...');
      const docRef = doc(this.contentRef, 'branding');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = {
          ...docSnap.data(),
          updatedAt: docSnap.data().updatedAt?.toDate(),
        } as IBrandingInfo;

        console.log('✅ Branding info fetched');
        return { success: true, data };
      } else {
        console.log('ℹ️ No branding info found, returning defaults');
        const defaultBranding: IBrandingInfo = {
          logoUrl: '',
          logoAltText: '',
          brandColors: {
            primary: '#3B82F6',
            secondary: '#1E40AF',
          },
          companyName: '',
        };
        return { success: true, data: defaultBranding };
      }
    } catch (error) {
      return this.handleError(error, 'Get branding info');
    }
  }

  async updateBrandingInfo(info: IBrandingInfo): Promise<IContentOperationResult<void>> {
    try {
      console.log('📝 Updating branding info:', info);
      const docRef = doc(this.contentRef, 'branding');
      const updateData = {
        ...info,
        updatedAt: serverTimestamp(),
      };

      await setDoc(docRef, updateData, { merge: true });
      console.log('✅ Branding info updated successfully');
      return { success: true };
    } catch (error) {
      return this.handleError(error, 'Update branding info');
    }
  }
}

export const contentService = new ContentService();
export default contentService;
