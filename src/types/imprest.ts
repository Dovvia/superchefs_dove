export interface Imprest {
  id: string;
  name: string;
  unit: string;
  unit_price: number;
  branch_id: string;
  quantity: number;
  user_id: string;
  status: string;
  created_at: string;
  user: {
    first_name: string;
    last_name: string;
  };
  branch: {
    name: string;
  };
}
