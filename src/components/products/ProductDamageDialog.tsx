import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductDamageForm } from "./ProductDamageForm";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/types/products";
import { useUserBranch } from "@/hooks/user-branch"; // Import the hook to get user branch info
import { useQuery } from "@tanstack/react-query";

interface ExtendedProduct extends Product {
  product_damage?: { quantity: number }[];
}
interface ProductDamageDialogProps {
  products: ExtendedProduct[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const ProductDamageDialog = ({
  products,
  open,
  onOpenChange,
  onSuccess,
}: ProductDamageDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Get the logged-in user's branch information
  const { data: userBranch } = useUserBranch() as {
    data: { id: string; name: string; role: string } | null;
  };

  // Fetch product_recipes for unit_cost
  const { data: productRecipes } = useQuery({
    queryKey: ["product_recipes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_recipes")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (values: {
    product: string;
    quantity: string;
    reason: string;
    branch: string; // This will no longer be used for branch users
  }) => {
    try {
      setIsLoading(true);

      // Use the branch_id from the logged-in user for branch users
      const branchId = userBranch?.id;

      if (!branchId) {
        throw new Error("Branch ID is missing. Please log in again.");
      }

      // Get unit_price from products and unit_cost from product_recipes
      const selectedProduct = products.find((p) => p.id === values.product);
      const recipe = productRecipes?.find(
        (r) => r.product_id === values.product
      );
      const unit_price = selectedProduct?.price ?? 0;
      const unit_cost = recipe?.unit_cost ?? 0;

      // Insert a new record into the product_damages table
      const { error } = await supabase.from("product_damages").insert([
        {
          branch_id: branchId, // Use the branch_id from the logged-in user
          product_id: values?.product,
          quantity: Number(values?.quantity),
          reason: values?.reason,
          unit_price,
          unit_cost,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product damage recorded successfully",
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error recording product damage:", error);
      toast({
        title: "Error",
        description: "Failed to record product damage",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Product Damage</DialogTitle>
        </DialogHeader>
        <ProductDamageForm
          products={products}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
