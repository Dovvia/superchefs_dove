import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ComplimentaryProductForm } from "./ComplimentaryProductForm";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/types/products";
import { useUserBranch } from "@/hooks/user-branch";
import { useQuery } from "@tanstack/react-query";

interface ComplimentaryProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  onSuccess?: () => void;
}

export const ComplimentaryProductDialog = ({
  open,
  onOpenChange,
  products,
  onSuccess,
}: ComplimentaryProductDialogProps) => {
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
    branch_id: string;
    quantity: string;
    reason: string;
    recipient: string;
  }) => {
    try {
      setIsLoading(true);

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

      // Insert a new record into the complimentary_products table
      const { error: insertError } = await supabase
        .from("complimentary_products")
        .insert([
          {
            product_id: values.product,
            branch_id: branchId,
            quantity: Number(values.quantity),
            reason: values.reason,
            recipient: values.recipient,
            created_at: new Date().toISOString(),
            unit_price,
            unit_cost,
          },
        ]);

      if (insertError) {
        console.error("Error inserting complimentary product:", insertError);
        throw insertError;
      }

      toast({
        title: "Success",
        description: "Complimentary product recorded successfully",
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error(
        "Error recording complimentary product:",
        JSON.stringify(error, null, 2)
      );
      toast({
        title: "Error",
        description: error.message || "Failed to record complimentary product",
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
          <DialogTitle>Record Complimentary Product</DialogTitle>
        </DialogHeader>
        <ComplimentaryProductForm
          products={products}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
