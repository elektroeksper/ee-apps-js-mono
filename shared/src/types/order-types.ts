import { OrderStatus } from "../enums";
import { IAddress } from "./common-types";

interface IOrder {
  id: string;
  userId: string;
  products: IOrderItem[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: IAddress;
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
}
interface IOrderItem {
  productId: string;
  quantity: number;
  price: number;
  product: IProduct;
}

interface IProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  inStock: boolean;
  specifications: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export type {
  IOrder,
  IOrderItem, IProduct
};
