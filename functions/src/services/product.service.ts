import * as admin from 'firebase-admin';
import { db } from '../utils/firebase-admin';
// Import types from shared-generated (will be copied at build time)
import { IOperationResult, IProduct } from '../shared-generated';

// Get all products
export async function getProducts(): Promise<IOperationResult<IProduct[]>> {
  try {
    const productsSnapshot = await db.collection('products').get();
    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as IProduct));

    return {
      success: true,
      data: products,
      code: 200
    };
  } catch (error) {
    console.error('Error getting products:', error);
    return {
      success: false,
      error: 'Failed to fetch products',
      code: 500
    };
  }
}

// Get product by ID
export async function getProduct(productId: string): Promise<IOperationResult<IProduct>> {
  try {
    if (!productId) {
      return {
        success: false,
        error: 'Product ID is required',
        code: 400
      };
    }

    const productDoc = await db.collection('products').doc(productId).get();

    if (!productDoc.exists) {
      return {
        success: false,
        error: 'Product not found',
        code: 404
      };
    }

    const product = {
      id: productDoc.id,
      ...productDoc.data()
    } as IProduct;

    return {
      success: true,
      data: product,
      code: 200
    };
  } catch (error) {
    console.error('Error getting product:', error);
    return {
      success: false,
      error: 'Failed to fetch product',
      code: 500
    };
  }
}

// Create a new product (admin only)
export async function createProduct(productData: Partial<IProduct>): Promise<IOperationResult<IProduct>> {
  try {
    const newProductData = {
      ...productData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const newProductRef = await db.collection('products').add(newProductData);
    const createdProduct = await newProductRef.get();

    const product = {
      id: createdProduct.id,
      ...createdProduct.data()
    } as IProduct;

    return {
      success: true,
      data: product,
      code: 201
    };
  } catch (error) {
    console.error('Error creating product:', error);
    return {
      success: false,
      error: 'Failed to create product',
      code: 500
    };
  }
}

// Update product
export async function updateProduct(productId: string, updates: Partial<IProduct>): Promise<IOperationResult<IProduct>> {
  try {
    if (!productId) {
      return {
        success: false,
        error: 'Product ID is required',
        code: 400
      };
    }

    const productRef = db.collection('products').doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      return {
        success: false,
        error: 'Product not found',
        code: 404
      };
    }

    const updateData = {
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await productRef.update(updateData);

    const updatedProduct = await productRef.get();
    const product = {
      id: updatedProduct.id,
      ...updatedProduct.data()
    } as IProduct;

    return {
      success: true,
      data: product,
      code: 200
    };
  } catch (error) {
    console.error('Error updating product:', error);
    return {
      success: false,
      error: 'Failed to update product',
      code: 500
    };
  }
}

// Delete product
export async function deleteProduct(productId: string): Promise<IOperationResult<void>> {
  try {
    if (!productId) {
      return {
        success: false,
        error: 'Product ID is required',
        code: 400
      };
    }

    const productRef = db.collection('products').doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      return {
        success: false,
        error: 'Product not found',
        code: 404
      };
    }

    await productRef.delete();

    return {
      success: true,
      code: 200
    };
  } catch (error) {
    console.error('Error deleting product:', error);
    return {
      success: false,
      error: 'Failed to delete product',
      code: 500
    };
  }
}
