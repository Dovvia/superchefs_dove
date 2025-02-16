import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ComplimentaryProductForm } from "./ComplimentaryProductForm";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/types/products";

interface ComplimentaryProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  branchId: string;
  onSuccess?: () => void;
}
 
export const ComplimentaryProductDialog = ({
  open,
  onOpenChange,
  product,
  branchId,
  onSuccess,
}: ComplimentaryProductDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (values: {
    quantity: number;
    reason: string;
    recipient: string;
  }) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.from("complimentary_products").insert([
        {
          product_id: product.id,
          branch_id: branchId,
          ...values,
        },
      ]);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Complimentary product recorded successfully",
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error recording complimentary product:", error);
      toast({
        title: "Error",
        description: "Failed to record complimentary product",
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
          product={product}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};