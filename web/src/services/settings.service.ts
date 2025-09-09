import { auth, db } from "@/config/firebase";
import { IOperationResult, ISettingItem, ISystemSettingsService, SettingsKey } from "@/shared-generated";
import { FB_COLL_NAMES } from "@/shared-generated/configs/contants";
import { SettingItem } from "@/shared-generated/models/common-models";
import { collection, CollectionReference, doc, DocumentData, getDoc, getDocs, Query, setDoc } from "firebase/firestore";

export class SettingsService implements ISystemSettingsService {
  colRef: CollectionReference<DocumentData>;
  constructor() {
    this.colRef = collection(db, FB_COLL_NAMES.settings) as CollectionReference<DocumentData>;
  }
  async getAll(filter: { isDeleted?: boolean; isActive?: boolean } = { isDeleted: false, isActive: true }): Promise<IOperationResult<ISettingItem[]>> {
    try {
      let q: Query = this.colRef;
      const { isDeleted, isActive } = filter;
      const queryConstraints = [];
      if (typeof isDeleted === "boolean") {
        queryConstraints.push(["isDeleted", "==", isDeleted]);
      }
      if (typeof isActive === "boolean") {
        queryConstraints.push(["isActive", "==", isActive]);
      }
      if (queryConstraints.length > 0) {
        const { query, where } = await import("firebase/firestore");
        q = query(this.colRef, ...queryConstraints.map(([field, op, value]) => where(field as string, op as any, value)));
      }

      const snapshot = await getDocs(q);
      const data: ISettingItem[] = [];
      if (snapshot.size > 0)
        data.push(...snapshot.docs.map(doc => {
          const settingData = doc.data() as ISettingItem;
          return new SettingItem(doc.id, { ...settingData, key: doc.id as SettingsKey });
        }));

      if (data.length > 0) {
        return { success: true, data };
      } else {
        return { success: false, error: "No settings found" };
      }
    } catch (error) {
      return { success: false, error: "Error getting settings" };
    }
  }

  async update(key: SettingsKey, value: any): Promise<IOperationResult<void>> {
    try {
      console.log('🔧 Settings Update Debug:', {
        key,
        value,
        valueType: typeof value,
        timestamp: new Date().toISOString(),
        user: auth.currentUser?.uid || 'Anonymous'
      });

      const settingRef = doc(this.colRef, key);
      const setting = await getDoc(settingRef);

      if (setting.exists()) {
        const updateData = {
          value,
          updatedBy: auth.currentUser?.uid || 'system',
          updatedAt: new Date(),
          isActive: true, // Ensure the setting remains active after update
        };

        console.log('📝 Update data being sent to Firestore:', updateData);

        await setDoc(settingRef, updateData, { merge: true });

        console.log('✅ Setting updated successfully:', {
          key,
          newValue: value,
          updatedAt: updateData.updatedAt
        });

        return { success: true };
      } else {
        console.log('❌ Setting not found, creating new one:', key);

        // Create the setting if it doesn't exist
        const newSettingData = {
          key,
          value,
          isActive: true,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          updatedBy: auth.currentUser?.uid || 'system'
        };

        await setDoc(settingRef, newSettingData);

        console.log('✅ New setting created:', newSettingData);

        return { success: true };
      }
    } catch (error) {
      console.error('❌ Error updating setting:', {
        key,
        value,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Error updating setting",
        details: error instanceof Error ? error.stack : undefined
      };
    }
  }

  async remove(key: SettingsKey): Promise<IOperationResult<void>> {
    try {
      const setting = await getDoc(doc(this.colRef, key));
      if (setting.exists()) {
        await setDoc(doc(this.colRef, key), {
          isDeleted: true, updatedBy: auth.currentUser?.uid, updatedAt: new Date()
        }, { merge: true });
        return { success: true };
      } else {
        return { success: false, error: "Setting not found" };
      }
    } catch (error) {
      return { success: false, error: "Error removing setting" };
    }
  }
}

export default new SettingsService();