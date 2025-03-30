import { ProductDamage } from "./damages";

export interface ProductTransfer {
  id: string;
  to_branch_id: string;
  from_branch_id: string;
  product_id: string;
  quantity: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  unit_cost: number;
  category: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  openingStock: number;
  producedStock: number;
  transferIn: number;
  transferOut: number;
  complimentary: number;
  damages: number;
  sales: number;
  closingStock: number;
  branch_id: string;
}

export interface Sale {
  id: string;
  branch_id: string;
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
  product?: Product;
}
