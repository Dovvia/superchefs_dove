import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Material } from "@/types/inventory";

interface DamagedMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: Material | null;
  branchId: string;
}

const DamagedMaterialDialog = ({
  open,
  onOpenChange,
  material,
  branchId,
}: DamagedMaterialDialogProps) => {
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!material) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from("damaged_materials").insert([
        {
          material_id: material.id,
          branch_id: branchId,
          quantity: Number(quantity),
          reason,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Damage recorded",
        description: "The damaged material has been recorded successfully.",
      });

      queryClient.invalidateQueries({ queryKey: ["damaged-materials"] });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
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
          <DialogTitle>Record Damaged Material</DialogTitle>
          <DialogDescription>
            Record damaged quantity for {material?.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Damaged Quantity ({material?.unit})</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Damage</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain the reason for the damage..."
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              Record Damage
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DamagedMaterialDialog;