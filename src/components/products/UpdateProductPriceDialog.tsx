import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface UpdateProductPriceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: { id: string; name: string } | null;
  onSuccess: () => void;
}

const UpdateProductPriceDialog = ({
  open,
  onOpenChange,
  product,
  onSuccess,
}: UpdateProductPriceDialogProps) => {
  const [newPrice, setNewPrice] = useState<number | string>("");
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  // Fetch and set the current price when the dialog opens
  useEffect(() => {
    const fetchCurrentPrice = async () => {
      if (product?.id) {
        const { data, error } = await supabase
          .from("products")
          .select("price")
          .eq("id", product.id)
          .single();

        if (error) {
          console.error("Error fetching product price:", error);
          toast({
            title: "Error",
            description: "Failed to fetch product price.",
            variant: "destructive",
          });
        } else {
          setCurrentPrice(data?.price || null);
        }
      }
    };

    if (open) {
      fetchCurrentPrice();
    }
  }, [open, product]);

  const handleUpdatePrice = async () => {
    if (!product || !newPrice) {
      toast({
        title: "Error",
        description: "Please fill all fields correctly.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("products")
        .update({ price: Number(newPrice) })
        .eq("id", product.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Product price updated successfully.",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating product price:", error);
      toast({
        title: "Error",
        description: "Failed to update product price.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Product Price</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>
            Update the price for <strong>{product?.name}</strong>.
          </p>
          {currentPrice !== null && (
            <p className="text-gray-600">
              Current Price: <strong>₦{currentPrice.toFixed(2)}</strong>
            </p>
          )}
          <Input
            type="number"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            placeholder="Enter new price"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdatePrice}>Update</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateProductPriceDialog;
