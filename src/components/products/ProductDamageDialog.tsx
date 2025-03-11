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

  const handleSubmit = async (values: {
    product: string;
    quantity: string;
    reason: string;
    branch: string;
  }) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.from("product_damages").insert([
        {
          branch_id: values?.branch,
          product_id: values?.product,
          quantity: Number(values?.quantity),
          reason: values?.reason,
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
