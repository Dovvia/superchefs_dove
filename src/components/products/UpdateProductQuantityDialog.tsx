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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface UpdateProductQuantityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: { id: string; name: string } | null;
  branches: { id: string; name: string }[];
  onSuccess: () => void;
}

const UpdateProductQuantityDialog = ({
  open,
  onOpenChange,
  product,
  branches,
  onSuccess,
}: UpdateProductQuantityDialogProps) => {
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [newQuantity, setNewQuantity] = useState<number | string>("");

  const handleUpdateQuantity = async () => {
    if (!product || !selectedBranch || !newQuantity) {
      toast({
        title: "Error",
        description: "Please fill all fields correctly.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("product_inventory").insert(
      {
        product_id: product.id,
        branch_id: selectedBranch,
        quantity: Number(newQuantity),
        name: product.name,
      },
    );

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update product quantity.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Product quantity updated successfully.",
      });
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Product Quantity</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>
            Add quantity for <strong>{product?.name}</strong>.
          </p>
          <Select
            value={selectedBranch}
            onValueChange={(value) => setSelectedBranch(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            value={newQuantity}
            onChange={(e) => setNewQuantity(e.target.value)}
            placeholder="Enter new quantity"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdateQuantity}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateProductQuantityDialog;
