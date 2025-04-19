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

  const handleSubmit = async (values: {
    product: string;
    branch_id: string;
    quantity: string;
    reason: string;
    recipient: string;
  }) => {
    const { product: product_id, ...rest } = values;
    try {
      setIsLoading(true);

      // Fetch product inventory
      const { data: productInventory, error: inventoryFetchError } = await supabase
        .from("product_inventory")
        .select("id, quantity")
        .eq("product_id", product_id)
        .eq("branch_id", rest.branch_id)
        .maybeSingle();

      if (inventoryFetchError) {
        console.error("Error fetching product inventory:", inventoryFetchError);
        throw inventoryFetchError;
      }

      if (!productInventory) {
        throw new Error("Product inventory not found");
      }

      const currentQuantity = productInventory.quantity || 0;
      const newQuantity = currentQuantity - Number(values?.quantity);

      if (newQuantity < 0) {
        toast({
          title: "Error",
          description: "Insufficient product quantity in inventory",
          variant: "destructive",
        });
        return;
      }

      // Update product inventory
      const { error: updateInventoryError } = await supabase
        .from("product_inventory")
        .update({ quantity: newQuantity })
        .eq("id", productInventory.id);

      if (updateInventoryError) {
        console.error("Error updating product inventory:", updateInventoryError);
        throw updateInventoryError;
      }

      // Fetch all complimentary product records for the product and branch
      const { data: complimentaryProducts, error: fetchComplimentaryError } = await supabase
        .from("complimentary_products")
        .select("id, quantity")
        .eq("product_id", product_id)
        .eq("branch_id", rest.branch_id);

      if (fetchComplimentaryError) {
        console.error("Error fetching complimentary products:", fetchComplimentaryError);
        throw fetchComplimentaryError;
      }

      if (complimentaryProducts && complimentaryProducts.length > 0) {
        // Aggregate the quantities
        const totalQuantity = complimentaryProducts.reduce((sum, item) => sum + item.quantity, 0);

        // Update the first record
        const firstProduct = complimentaryProducts[0];
        const { error: updateComplimentaryError } = await supabase
          .from("complimentary_products")
          .update({
            quantity: totalQuantity + Number(values?.quantity),
            reason: rest.reason,
            recipient: rest.recipient,
            updated_at: new Date().toISOString(),
          })
          .eq("id", firstProduct.id);

        if (updateComplimentaryError) {
          console.error("Error updating complimentary product quantity:", updateComplimentaryError);
          throw updateComplimentaryError;
        }
      } else {
        // Insert a new record if no complimentary products exist
        const { error: insertError } = await supabase.from("complimentary_products").insert([
          {
            product_id,
            ...rest,
            quantity: Number(values?.quantity),
          },
        ]);

        if (insertError) {
          console.error("Error inserting complimentary product:", insertError);
          throw insertError;
        }
      }

      toast({
        title: "Success",
        description: "Complimentary product recorded successfully",
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error recording complimentary product:", JSON.stringify(error, null, 2));
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
