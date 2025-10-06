import categoryService from "@services/category.service";
import { onCall } from "firebase-functions/v2/https";

export const initMainCategories = onCall(
  async (_request) => {
    return await categoryService.initialize();
  }
);