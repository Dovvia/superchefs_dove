import { useState } from "react";
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

interface UpdateMaterialCostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: { id: string; name: string; unit_price: number } | null;
  onSuccess: () => void;
}

const UpdateMaterialCostDialog = ({
  open,
  onOpenChange,
  material,
  onSuccess,
}: UpdateMaterialCostDialogProps) => {
  const [newCost, setNewCost] = useState<number | string>(
    material?.unit_price || ""
  );

  const handleUpdateCost = async () => {
    if (!material || !newCost) return;

    const { error } = await supabase
      .from("materials")
      .update({ unit_price: Number(newCost) })
      .eq("id", material.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update material cost.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Material cost updated successfully.",
      });
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Material Cost</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>
            Update the cost for <strong>{material?.name}</strong>.
          </p>
          <Input
            type="number"
            value={newCost}
            onChange={(e) => setNewCost(e.target.value)}
            placeholder="Enter new cost"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdateCost}>Update</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateMaterialCostDialog;
