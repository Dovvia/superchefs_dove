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

interface ProductDamageDialogProps {
  open: boolean;
  product: Product;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (id: string, damages_id: string) => void;
}

export const ProductDamageDialog = ({
  open,
  product,
  onOpenChange,
  onSuccess,
}: ProductDamageDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (values: {
    product: string;
    quantity: number;
    reason: string;
    branch: string;
  }) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("product_damages")
        .insert([
          {
            branch_id: values?.branch,
            product_id: values?.product,
            quantity: values?.quantity,
            reason: values?.reason,
          },
        ])
        .select("product_id, id");
      if (error) throw error;

      toast({
        title: "Success",
        description: "Product damage recorded successfully",
      });
      if (data && data?.length > 0) {
        onSuccess?.(data[0]?.product_id, data[0]?.id);
      }
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
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
