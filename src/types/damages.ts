export interface Damage {
  id: string;
  material_id: string;
  branch_id: string;
  quantity: number;
  user_id: string;
  reason: string;
  created_at: string;
  user: {
    first_name: string;
    last_name: string;
  };
  branch: {
    name: string;
  };
  material: {
    name: string;
    unit: string;
    unit_price: number;
  };
}

export interface ProductDamage {
  branch_id: string;
  created_at: string;
  id: string;
  product_id: string;
  quantity: number;
  reason: string;
  updated_at: string;
}
