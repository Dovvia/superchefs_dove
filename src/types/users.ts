export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
  user_roles: UserRole[];
  branch_id: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  // role: "admin" | "manager" | "staff";
  role:
    | "staff"
    | "baker"
    | "cleaner"
    | "sales_rep"
    | "cook"
    | "manager"
    | "procurement"
    | "accountant"
    | "maintenance"
    | "quality_control"
    | "supplier"
    | "head_office_supplier"
    | "area_manager"
    | "admin";
  created_at: string;
  branch_id: string;
}
