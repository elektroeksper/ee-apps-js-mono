import * as admin from 'firebase-admin';
import { db } from '../utils/firebase-admin';
// Import types from shared-generated (will be copied at build time)
import { IOperationResult, IOrder, OrderStatus } from '../shared-generated';

// Get user orders
export async function getUserOrders(userId: string): Promise<IOperationResult<IOrder[]>> {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
        code: 400
      };
    }

    const ordersSnapshot = await db.collection('orders')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as IOrder));

    return {
      success: true,
      data: orders,
      code: 200
    };
  } catch (error) {
    console.error('Error getting user orders:', error);
    return {
      success: false,
      error: 'Failed to fetch user orders',
      code: 500
    };
  }
}

// Get order by ID
export async function getOrder(orderId: string, userId: string): Promise<IOperationResult<IOrder>> {
  try {
    if (!orderId || !userId) {
      return {
        success: false,
        error: 'Order ID and User ID are required',
        code: 400
      };
    }

    const orderDoc = await db.collection('orders').doc(orderId).get();

    if (!orderDoc.exists) {
      return {
        success: false,
        error: 'Order not found',
        code: 404
      };
    }

    const orderData = orderDoc.data();

    // Check if user owns this order
    if (orderData?.userId !== userId) {
      return {
        success: false,
        error: 'Access denied',
        code: 403
      };
    }

    const order = {
      id: orderDoc.id,
      ...orderData
    } as IOrder;

    return {
      success: true,
      data: order,
      code: 200
    };
  } catch (error) {
    console.error('Error getting order:', error);
    return {
      success: false,
      error: 'Failed to fetch order',
      code: 500
    };
  }
}

// Create new order
export async function createOrder(userId: string, orderData: Partial<IOrder>): Promise<IOperationResult<IOrder>> {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
        code: 400
      };
    }

    // Calculate total amount
    let totalAmount = 0;
    if (orderData.products && Array.isArray(orderData.products)) {
      totalAmount = orderData.products.reduce((sum: number, item: any) => {
        return sum + (item.price * item.quantity);
      }, 0);
    }

    const newOrderData = {
      userId,
      ...orderData,
      totalAmount,
      status: OrderStatus.PENDING,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const newOrderRef = await db.collection('orders').add(newOrderData);
    const createdOrder = await newOrderRef.get();

    const order = {
      id: createdOrder.id,
      ...createdOrder.data()
    } as IOrder;

    return {
      success: true,
      data: order,
      code: 201
    };
  } catch (error) {
    console.error('Error creating order:', error);
    return {
      success: false,
      error: 'Failed to create order',
      code: 500
    };
  }
}

// Update order status (admin only)
export async function updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<IOperationResult<IOrder>> {
  try {
    if (!orderId || !newStatus) {
      return {
        success: false,
        error: 'Order ID and status are required',
        code: 400
      };
    }

    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return {
        success: false,
        error: 'Order not found',
        code: 404
      };
    }

    await orderRef.update({
      status: newStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const updatedOrder = await orderRef.get();
    const order = {
      id: updatedOrder.id,
      ...updatedOrder.data()
    } as IOrder;

    return {
      success: true,
      data: order,
      code: 200
    };
  } catch (error) {
    console.error('Error updating order status:', error);
    return {
      success: false,
      error: 'Failed to update order status',
      code: 500
    };
  }
}
