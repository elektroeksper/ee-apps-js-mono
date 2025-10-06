
import { db } from '@/config/firebase-client-only';
import {
  FB_COLL_NAMES,
  ICategory,
  IOperationResult
} from '@/shared';
import { DocumentSnapshot } from 'firebase/firestore';


export class CategoriesService {
  async getAll(): Promise<IOperationResult<ICategory[]>> {
    const snapshot = await db.collection(FB_COLL_NAMES.categories).get();
    const categories: ICategory[] = snapshot.docs.map((doc: DocumentSnapshot) => ({
      id: doc.id,
      ...doc.data(),
    })) as ICategory[];
    return { success: true, data: categories };
  }
}

// Export a singleton instance
export const categoriesService = new CategoriesService()
