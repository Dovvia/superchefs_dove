export interface Imprest {
  id: string;
  name: string;
  unit: string;
  unit_price: number;
  branch_id: string;
  quantity: number;
  user_id: string;
  status: "pending" | "supplied" | "approved";
  created_at: string;
  user: {
    first_name: string;
    last_name: string;
  };
  branch: {
    name: string;
  };
  orders: {
    imprest_order_id: string;
  }[];
}

export interface ImprestOrderItem {
  id: string;
  imprest: {
    id: string;
    name: string;
    unit: string;
    unit_price: number;
    quantity: number;
    branch: {
      address: string;
      id: string;
      name: string;
      manager: string;
      phone: string;
    };
  };
}

export interface ImprestOrder {
  id: string;
  status: "pending" | "supplied" | "approved";
  created_at: string;
  updated_at: string;
  items: ImprestOrderItem[];
}

export interface MiniImprestOrderItem {
  id: string;
  order_id: string;
  quantity: string;
  name: string;
  unit: string;
  unit_price: number;
}
