import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StockMovementForm from "./StockMovementForm";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Inventory } from "@/types/inventory";

interface StockMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: Inventory;
  onSuccess: () => void;
}

export const StockMovementDialog = ({
  open,
  onOpenChange,
  inventory,
  onSuccess,
}: StockMovementDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (values: {
    quantity: number;
    notes?: string;
    transaction_type: "in" | "out";
  }) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.from("inventory_transactions").insert([
        {
          inventory_id: inventory.id,
          ...values,
        },
      ]);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Stock movement recorded successfully",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error recording stock movement:", error);
      toast({
        title: "Error",
        description: "Failed to record stock movement",
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
          <DialogTitle>Record Stock Movement</DialogTitle>
        </DialogHeader>
        <StockMovementForm 
          onSubmit={handleSubmit} 
          isLoading={isLoading} 
          onCancel={() => onOpenChange(false)} 
        />
      </DialogContent>
    </Dialog>
  );
};