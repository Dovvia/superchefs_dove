import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProductDamageForm } from "./ProductDamageForm";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/types/products";

interface ProductDamageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product; 
  branchId: string;
  onSuccess?: () => void;
}

export const ProductDamageDialog = ({
  open,
  onOpenChange,
  product,
  branchId,
  onSuccess,
}: ProductDamageDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (values: {
    quantity: number;
    reason: string;
  }) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.from("product_damages").insert([
        {
          product_id: product.id,
          branch_id: branchId,
          ...values,
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
          product={product}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};