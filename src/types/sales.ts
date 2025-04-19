import { Product } from "./products";

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
  product?: Product;
  unit_cost: number;
  
}

export interface Sale {
  id: string;
  branch_id: string;
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  updated_at: string;
  items?: SaleItem[];
}