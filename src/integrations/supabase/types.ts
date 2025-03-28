export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      branches: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      complimentary_products: {
        Row: {
          branch_id: string;
          created_at: string;
          id: string;
          product_id: string;
          quantity: number;
          reason: string;
          recipient: string | null;
          updated_at: string;
        };
        Insert: {
          branch_id: string;
          created_at?: string;
          id?: string;
          product_id: string;
          quantity?: number;
          reason: string;
          recipient?: string | null;
          updated_at?: string;
        };
        Update: {
          branch_id?: string;
          created_at?: string;
          id?: string;
          product_id?: string;
          quantity?: number;
          reason?: string;
          recipient?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "complimentary_products_product_id_fkey1";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "complimentary_products_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "complimentary_products_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      damaged_materials: {
        Row: {
          branch_id: string;
          created_at: string;
          id: string;
          material_id: string;
          quantity: number;
          reason: string;
          user_id: string;
        };
        Insert: {
          branch_id: string;
          created_at?: string;
          id?: string;
          material_id: string;
          quantity: number;
          reason: string;
          user_id: string;
        };
        Update: {
          branch_id?: string;
          created_at?: string;
          id?: string;
          material_id?: string;
          quantity?: number;
          reason?: string;
          user_id: string;
        };
        Relationships: [
          {
            foreignKeyName: "damaged_materials_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "damaged_materials_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "materials";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "damaged_materials_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      inventory: {
        Row: {
          closing_stock: number;
          created_at: string;
          damages: number;
          id: string;
          material_id: string;
          opening_stock: number;
          quantity: number;
          request_order: number;
          transfer: number;
          updated_at: string;
          usage: number;
          procurement: number;
        };
        Insert: {
          closing_stock?: number;
          created_at?: string;
          damages?: number;
          id?: string;
          material_id: string;
          opening_stock?: number;
          quantity?: number;
          request_order?: number;
          transfer?: number;
          updated_at?: string;
          usage?: number;
          procurement?: number;
        };
        Update: {
          closing_stock?: number;
          created_at?: string;
          damages?: number;
          id?: string;
          material_id?: string;
          opening_stock?: number;
          quantity?: number;
          request_order?: number;
          transfer?: number;
          updated_at?: string;
          usage?: number;
          procurement?: number;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "materials";
            referencedColumns: ["id"];
          }
        ];
      };
      inventory_transactions: {
        Row: {
          created_at: string;
          id: string;
          inventory_id: string;
          notes: string | null;
          quantity: number;
          transaction_type: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          inventory_id: string;
          notes?: string | null;
          quantity: number;
          transaction_type: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          inventory_id?: string;
          notes?: string | null;
          quantity?: number;
          transaction_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_inventory_id_fkey";
            columns: ["inventory_id"];
            isOneToOne: false;
            referencedRelation: "inventory";
            referencedColumns: ["id"];
          }
        ];
      };
      material_requests: {
        Row: {
          branch_id: string;
          user_id: string;
          created_at: string;
          updated_at: string;
          id: string;
          material_id: string;
          notes: string | null;
          quantity: number;
          status: "pending" | "approved" | "supplied";
        };
        Insert: {
          branch_id: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
          id?: string;
          material_id: string;
          notes?: string | null;
          quantity: number;
          status?: "pending" | "approved" | "supplied";
        };
        Update: {
          branch_id?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
          id?: string;
          material_id?: string;
          notes?: string | null;
          quantity?: number;
          status?: "pending" | "approved" | "supplied";
        };
        Relationships: [
          {
            foreignKeyName: "material_requests_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "material_requests_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "materials";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "material_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      material_transfers: {
        Row: {
          created_at: string;
          from_branch_id: string;
          id: string;
          material_id: string;
          notes: string | null;
          quantity: number;
          status: string;
          to_branch_id: string;
        };
        Insert: {
          created_at?: string;
          from_branch_id: string;
          id?: string;
          material_id: string;
          notes?: string | null;
          quantity: number;
          status?: string;
          to_branch_id: string;
        };
        Update: {
          created_at?: string;
          from_branch_id?: string;
          id?: string;
          material_id?: string;
          notes?: string | null;
          quantity?: number;
          status?: string;
          to_branch_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "material_transfers_from_branch_id_fkey";
            columns: ["from_branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "material_transfers_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "materials";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "material_transfers_to_branch_id_fkey";
            columns: ["to_branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          }
        ];
      };
      materials: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          minimum_stock: number;
          name: string;
          unit: string;
          unit_price: number;
          updated_at: string;
          branch_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          minimum_stock?: number;
          name: string;
          unit: string;
          unit_price?: number;
          updated_at?: string;
          branch_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          minimum_stock?: number;
          name?: string;
          unit?: string;
          unit_price?: number;
          updated_at?: string;
          branch_id: string;
        };
        Relationships: [
          {
            foreignKeyName: "materials_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          }
        ];
      };
      imprest_requests: {
        Row: {
          branch_id: string;
          created_at: string;
          updated_at: string;
          id: string;
          name: string;
          unit: string;
          unit_price: number;
          quantity: number;
          user_id: string;
          status: "pending" | "approved" | "supplied";
        };
        Insert: {
          branch_id: string;
          created_at?: string;
          updated_at?: string;
          id?: string;
          name: string;
          unit: string;
          unit_price: number;
          quantity: number;
          user_id: string;
          status: "pending" | "approved" | "supplied";
        };
        Update: {
          branch_id?: string;
          created_at?: string;
          updated_at?: string;
          id?: string;
          name?: string;
          unit?: string;
          unit_price?: number;
          quantity?: number;
          user_id?: string;
          status?: "pending" | "approved" | "supplied";
        };
        Relationships: [
          {
            foreignKeyName: "imprest_requests_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "imprest_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          branch_id: string;
          created_at: string;
          id: string;
          message: string;
          read: boolean;
          title: string;
        };
        Insert: {
          branch_id: string;
          created_at?: string;
          id?: string;
          message: string;
          read?: boolean;
          title: string;
        };
        Update: {
          branch_id?: string;
          created_at?: string;
          id?: string;
          message?: string;
          read?: boolean;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          }
        ];
      };
      imprest_orders: {
        Row: {
          created_at: string;
          id: string;
          imprest_request_id: string;
          notes: string | null;
          status: "pending" | "approved" | "supplied";
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          imprest_request_id?: string;
          notes?: string | null;
          status?: "pending" | "approved" | "supplied";
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          imprest_request_id?: string;
          notes?: string | null;
          status?: "pending" | "approved" | "supplied";
          updated_at?: string;
        };
        Relationships: [];
      };
      imprest_order_items: {
        Row: {
          created_at: string;
          id: string;
          imprest_request_id: string;
          imprest_order_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          imprest_request_id: string;
          imprest_order_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          imprest_request_id?: string;
          imprest_order_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "imprest_order_items_material_request_id_fkey";
            columns: ["imprest_request_id"];
            isOneToOne: false;
            referencedRelation: "imprest_requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "imprest_order_items_imprest_order_id_fkey";
            columns: ["imprest_order_id"];
            isOneToOne: false;
            referencedRelation: "imprest_orders";
            referencedColumns: ["id"];
          }
        ];
      };
      procurement_order_items: {
        Row: {
          created_at: string;
          id: string;
          material_request_id: string;
          procurement_order_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          material_request_id: string;
          procurement_order_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          material_request_id?: string;
          procurement_order_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "procurement_order_items_material_request_id_fkey";
            columns: ["material_request_id"];
            isOneToOne: false;
            referencedRelation: "material_requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "procurement_order_items_procurement_order_id_fkey";
            columns: ["procurement_order_id"];
            isOneToOne: false;
            referencedRelation: "procurement_orders";
            referencedColumns: ["id"];
          }
        ];
      };
      procurement_orders: {
        Row: {
          created_at: string;
          id: string;
          material_request_id: string;
          notes: string | null;
          status: "pending" | "approved" | "supplied";
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          material_request_id?: string;
          notes?: string | null;
          status?: "pending" | "approved" | "supplied";
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          material_request_id?: string;
          notes?: string | null;
          status?: "pending" | "approved" | "supplied";
          updated_at?: string;
        };
        Relationships: [];
      };
      procurement_supplied: {
        Row: {
          created_at: string;
          id: string;
          material_order_id: string;
          quantity: number;
          unit: string;
          notes: string | null;
          status: "approved" | "supplied" | "pending";
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          material_order_id?: string;
          quantity?: number;
          unit?: string;
          notes?: string | null;
          status?: "approved" | "supplied" | "pending";
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          material_order_id?: string;
          quantity?: number;
          unit?: string;
          notes?: string | null;
          status?: "approved" | "supplied" | "pending";
          updated_at?: string;
        };
        Relationships: [];
      };
      imprest_supplied: {
        Row: {
          created_at: string;
          id: string;
          imprest_order_id: string;
          quantity: number;
          unit: string;
          notes: string | null;
          status: "approved" | "supplied" | "pending";
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          imprest_order_id?: string;
          quantity?: number;
          unit?: string;
          notes?: string | null;
          status?: "approved" | "supplied" | "pending";
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          imprest_order_id?: string;
          quantity?: number;
          unit?: string;
          notes?: string | null;
          status?: "approved" | "supplied" | "pending";
          updated_at?: string;
        };
        Relationships: [];
      };
      product_damages: {
        Row: {
          branch_id: string;
          created_at: string;
          id: string;
          product_id: string;
          quantity: number;
          reason: string;
          updated_at: string;
        };
        Insert: {
          branch_id: string;
          created_at?: string;
          id?: string;
          product_id: string;
          quantity?: number;
          reason: string;
          updated_at?: string;
        };
        Update: {
          branch_id?: string;
          created_at?: string;
          id?: string;
          product_id?: string;
          quantity?: number;
          reason?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_damages_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      product_recipes: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          product_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          product_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          product_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_recipes_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_recipes_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "materials";
            referencedColumns: ["id"];
          }
        ];
      };
      product_transfers: {
        Row: {
          created_at: string;
          from_branch_id: string;
          id: string;
          product_id: string;
          notes: string | null;
          quantity: number;
          status: string;
          to_branch_id: string;
        };
        Insert: {
          created_at?: string;
          from_branch_id: string;
          id?: string;
          product_id: string;
          notes?: string | null;
          quantity: number;
          status?: string;
          to_branch_id: string;
        };
        Update: {
          created_at?: string;
          from_branch_id?: string;
          id?: string;
          product_id?: string;
          notes?: string | null;
          quantity?: number;
          status?: string;
          to_branch_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_transfers_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
          // {
          //   foreignKeyName: "product_transfers_id_fkey";
          //   columns: ["id"];
          //   isOneToOne: false;
          //   referencedRelation: "products";
          //   referencedColumns: ["transfer_id"];
          // },
          // {
          //   foreignKeyName: "product_transfers_from_branch_id_fkey";
          //   columns: ["from_branch_id"];
          //   isOneToOne: false;
          //   referencedRelation: "branches";
          //   referencedColumns: ["id"];
          // },
          // {
          //   foreignKeyName: "product_transfers_to_branch_id_fkey";
          //   columns: ["to_branch_id"];
          //   isOneToOne: false;
          //   referencedRelation: "branches";
          //   referencedColumns: ["id"];
          // }
        ];
      };
      products: {
        Row: {
          category: string | null;
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          name: string;
          price: number;
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
        };
        Insert: {
          category?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          name: string;
          price?: number;
          updated_at?: string;
          openingStock: number;
          producedStock: number;
          transferIn: number;
          transferOut: number;
          complimentary: number;
          damages: number;
          sales: number;
          closingStock: number;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          name?: string;
          price?: number;
          updated_at?: string;
          openingStock?: number;
          producedStock?: number;
          transferIn?: number;
          transferOut?: number;
          complimentary?: number;
          damages?: number;
          sales?: number;
          closingStock?: number;
        };
        Relationships: [
          {
            foreignKeyName: "products_damages_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "product_damages";
            referencedColumns: ["product_id"];
          },
          {
            foreignKeyName: "product_transfers_product_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "product_transfers";
            referencedColumns: ["product_id"];
          },
          {
            foreignKeyName: "products_cmp_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "complimentary_products";
            referencedColumns: ["product_id"];
          }
        ];
      };
      product_inventory: {
        Row: {
          production: number;
          id: string;
          name: string;
          category: string;
          product_id: string;
          branch_id: string;
          opening_stock: number;
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
        };
        Insert: {
          product_id: string;
          opening_stock: number;
          production: number;
          // id: string;
          // name: string;
          // category: string;
          // branch_id: string;
          // transfer_in: number;
          // transfer_out: number;
          // damages: number;
          // complimentary: number;
          // sales: number;
          // closing_stock: number;
          // ucrr: number;
          // scrr: number;
          // created_at: string;
          // updated_at: string;
        };
        Update: {
          production: number;
          // id: string;
          // name: string;
          // category: string;
          // product_id: string;
          // branch_id: string;
          // opening_stock: number;
          // transfer_in: number;
          // transfer_out: number;
          // damages: number;
          // complimentary: number;
          // sales: number;
          // closing_stock: number;
          // ucrr: number;
          // scrr: number;
          // created_at: string;
          // updated_at: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_inventory_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_inventory_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          first_name: string | null;
          id: string;
          last_name: string | null;
          updated_at: string;
          branch_id: string;
        };
        Insert: {
          created_at?: string;
          first_name?: string | null;
          id: string;
          last_name?: string | null;
          updated_at?: string;
          branch_id: string;
        };
        Update: {
          created_at?: string;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          updated_at?: string;
          branch_id?: string;
        };
        Relationships: [];
      };
      recipe_materials: {
        Row: {
          created_at: string;
          id: string;
          material_id: string;
          quantity: number;
          recipe_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          material_id: string;
          quantity?: number;
          recipe_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          material_id?: string;
          quantity?: number;
          recipe_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recipe_materials_material_id_fkey";
            columns: ["material_id"];
            isOneToOne: false;
            referencedRelation: "materials";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recipe_materials_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "product_recipes";
            referencedColumns: ["id"];
          }
        ];
      };
      sale_items: {
        Row: {
          created_at: string;
          id: string;
          product_id: string;
          quantity: number;
          sale_id: string;
          subtotal: number;
          unit_price: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          product_id: string;
          quantity?: number;
          sale_id: string;
          subtotal?: number;
          unit_price?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          product_id?: string;
          quantity?: number;
          sale_id?: string;
          subtotal?: number;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          }
        ];
      };
      sales: {
        Row: {
          branch_id: string;
          created_at: string;
          id: string;
          payment_method: string;
          status: string;
          total_amount: number;
          updated_at: string;
        };
        Insert: {
          branch_id: string;
          created_at?: string;
          id?: string;
          payment_method: string;
          status?: string;
          total_amount?: number;
          updated_at?: string;
        };
        Update: {
          branch_id?: string;
          created_at?: string;
          id?: string;
          payment_method?: string;
          status?: string;
          total_amount?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sales_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          }
        ];
      };
      user_roles: {
        Row: {
          branch_id: string | null;
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          branch_id?: string | null;
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          branch_id?: string | null;
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          user_id: string;
          role: Database["public"]["Enums"]["app_role"];
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "staff" | "manager";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
      PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
      PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
  ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;
