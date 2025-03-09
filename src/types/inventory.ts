import { NumberDomain } from "recharts/types/util/types";

export interface Material {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  unit_price: number;
  minimum_stock: number;
  created_at: string;
  updated_at: string;
}

export interface Inventory {
  id: string;
  material_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  material?: Material;
  opening_stock?: number;
  procurement: number;
  transfer_in: number;
  transfer_out: number;
  usage?: number;
  damages: number;
  closing_stock: number;
  request_order: number;
}

export interface InventoryTransaction {
  id: string;
  inventory_id: string;
  transaction_type: "in" | "out";
  quantity: number;
  notes: string | null;
  created_at: string;
}

export interface MaterialRequest {
  id: string;
  branch_id: string;
  material_id: string;
  quantity: number;
  status: "pending" | "approved" | "rejected";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaterialTransfer {
  id: string;
  from_branch_id: string;
  to_branch_id: string;
  material_id: string;
  quantity: number;
  status: "pending" | "completed" | "cancelled";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DamagedMaterial {
  id: string;
  branch_id: string;
  material_id: string;
  quantity: number;
  reason: string;
  created_at: string;
}

export interface ProductInventory {
  id: string;
  name: string;
  category: string;
  product_id: string;
  branch_id: string;
  opening_stock: number;
  production?: number;
  transfer_in: number;
  transfer_out: number;
  damages: number;
  complimentary: number;
  sales: number;
  closing_stock: number;
  ucrr: number;
  scrr: number;
  created_at: string;
  updated_at: string;
}
