import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where
} from 'firebase/firestore';
import { db, FB_COLL_NAMES } from '../configs';
import { BusinessUserRole } from '../enums';
import { Business } from '../models/business-models';
import { IBusiness, IBusinessFilter, IBusinessService, IBusinessUserInfo, IOperationResult } from '../types';

export class BusinessService implements IBusinessService {
  private colRef = collection(db, FB_COLL_NAMES.businesses);

  async getAll(filter?: IBusinessFilter): Promise<IOperationResult<IBusiness[]>> {
    // Example: fetch all businesses, optionally filter by name
    try {
      // You can add more sophisticated filtering logic here
      let q = query(this.colRef);
      if (filter) {
        if (filter.status) {
          // Add status filtering logic here
          q = query(this.colRef, where('status', '==', filter.status));
        }
      }
      let businesses: IBusiness[] = [];
      const snapshot = await getDocs(q);
      snapshot.forEach(doc => {
        businesses.push({ id: doc.id, ...doc.data() } as IBusiness);
      });

      return { success: true, data: businesses };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async create(data: IBusiness): Promise<IOperationResult<IBusiness>> {
    try {
      const docRef = await addDoc(this.colRef, data);
      const doc = await getDoc(docRef);
      return { success: true, data: { id: docRef.id, ...new Business(docRef.id, doc.data()) } };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async update(id: string, data: Partial<IBusiness>): Promise<IOperationResult<IBusiness>> {
    try {
      const docRef = doc(db, FB_COLL_NAMES.businesses, id);
      await updateDoc(docRef, data);
      const updatedDoc = await getDoc(docRef);
      return { success: true, data: new Business(id, updatedDoc.data() as IBusiness) };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async getById(id: string): Promise<IOperationResult<IBusiness>> {
    try {
      const docRef = doc(db, FB_COLL_NAMES.businesses, id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return { success: false, error: 'Business not found' };
      }
      return { success: true, data: new Business(id, docSnap.data() as IBusiness) };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async delete(id: string): Promise<IOperationResult<void>> {
    try {
      await deleteDoc(doc(db, FB_COLL_NAMES.businesses, id));
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async verifyBusiness(id: string, approve: boolean, adminId: string, reason?: string): Promise<IOperationResult<void>> {
    try {
      await updateDoc(doc(db, FB_COLL_NAMES.businesses, id), {
        verified: approve,
        verifiedBy: adminId,
        verificationReason: reason || null,
        verificationDate: new Date()
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async addUser(businessId: string, userId: string, info: IBusinessUserInfo): Promise<IOperationResult<void>> {
    try {
      const businessDocRef = doc(db, FB_COLL_NAMES.businesses, businessId);
      const businessDoc = await getDoc(businessDocRef);
      if (!businessDoc.exists()) {
        return { success: false, error: 'Business not found' };
      }

      const businessData = businessDoc.data() as IBusiness;
      const users: Record<string, IBusinessUserInfo> = businessData.users || {};
      users[userId] = { ...info }
      await updateDoc(businessDocRef, { users: users });
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }
  async removeUser(businessId: string, userId: string): Promise<IOperationResult<void>> {
    try {
      const businessDocRef = doc(db, FB_COLL_NAMES.businesses, businessId);
      const businessDoc = await getDoc(businessDocRef);
      if (!businessDoc.exists()) {
        return { success: false, error: 'Business not found' };
      }

      const businessData = businessDoc.data() as IBusiness;
      const users = businessData.users || {};
      if (Object.keys(users).length === 0) {
        return { success: false, error: 'No users in the business' };
      }
      if (!users[userId]) {
        return { success: false, error: 'User not found in the business' };
      }
      delete users[userId];
      const updatedUsers = { ...users };
      await updateDoc(businessDocRef, { users: updatedUsers });
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async updateUserRole(businessId: string, userId: string, newRole: BusinessUserRole): Promise<IOperationResult<void>> {
    try {
      const businessDocRef = doc(db, FB_COLL_NAMES.businesses, businessId);
      const businessDoc = await getDoc(businessDocRef);
      if (!businessDoc.exists()) {
        return { success: false, error: 'Business not found' };
      }

      const businessData = businessDoc.data() as IBusiness;
      const users = businessData.users || {};
      if (Object.keys(users).length === 0) {
        return { success: false, error: 'No users in the business' };
      }
      if (!users[userId]) {
        return { success: false, error: 'User not found in the business' };
      }
      users[userId].role = newRole;
      await updateDoc(businessDocRef, { users: users });
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }

  }
}

export const businessService = new BusinessService();
