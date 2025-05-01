export interface MaterialRequest {
  id: string;
  material_id: string;
  branch_id: string;
  quantity: number;
  user_id: string;
  status: "pending" | "approved" | "supplied";
  created_at: string;
  user: {
    first_name: string;
    last_name: string;
  };
  branch: {
    name: string;
  };
  material: {
    inventory: {
      closing_stock: number;
      opening_stock: number;
      usage: number;
    }[];
    minimum_stock: number;
    id: string;
    name: string;
    unit: string;
    unit_price: number;
  };
  orders: {
    procurement_order_id: string;
  }[];
  updated_at: string;
}
