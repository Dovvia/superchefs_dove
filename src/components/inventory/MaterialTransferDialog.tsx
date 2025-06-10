import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useUserBranch } from "@/hooks/user-branch"; // Import the hook
import type { Material } from "@/types/inventory";

interface MaterialTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: Material | null;
  branches: { id: string; name: string }[];
  fromBranchId: string;
}

const MaterialTransferDialog = ({
  open,
  onOpenChange,
  material,
  branches,
}: MaterialTransferDialogProps) => {
  const [toBranchId, setToBranchId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: userBranch } = useUserBranch(); // Fetch user branch

  // Debugging log
  useEffect(() => {
    console.log("User Branch ID:", userBranch?.id); // Ensure this is not null or undefined
  }, [userBranch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!material) return;

    if (!userBranch?.id) {
      toast({
        title: "Error",
        description: "Your branch ID is not set. Please try again later.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Insert into material_transfers_out for the sending branch
      const { error: transferOutError } = await supabase
        .from("material_transfers_out")
        .insert([
          {
            material_id: material.id,
            branch_id: userBranch.id, // Sending branch
            quantity: Number(quantity),
            notes,
            status: "pending",
          },
        ]);

      if (transferOutError) throw transferOutError;

      // Insert into material_transfers_in for the receiving branch
      const { error: transferInError } = await supabase
        .from("material_transfers_in")
        .insert([
          {
            material_id: material.id,
            branch_id: toBranchId, // Receiving branch
            quantity: Number(quantity),
            notes,
            status: "pending",
          },
        ]);

      if (transferInError) throw transferInError;

      // Create notifications for both branches
      const toBranch = branches.find((b) => b.id === toBranchId);
      const fromBranch = branches.find((b) => b.id === userBranch.id);

      const notifications = [
        {
          branch_id: toBranchId,
          title: "Incoming Material Transfer",
          message: `${material.name} (${quantity} ${material.unit}) is being transferred to your branch from ${fromBranch?.name}`,
        },
        {
          branch_id: userBranch.id,
          title: "Outgoing Material Transfer",
          message: `${material.name} (${quantity} ${material.unit}) is being transferred to ${toBranch?.name}`,
        },
      ];

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (notificationError) throw notificationError;

      toast({
        title: "Transfer initiated",
        description: "The material transfer has been initiated successfully.",
      });

      queryClient.invalidateQueries({ queryKey: ["material-transfers"] });
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
          <DialogTitle>Transfer Material</DialogTitle>
          <DialogDescription>
            Transfer {material?.name} to another branch
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="toBranch">To Branch</Label>
            <Select value={toBranchId} onValueChange={setToBranchId}>
              <SelectTrigger>
                <SelectValue placeholder="Select destination branch" />
              </SelectTrigger>
              <SelectContent>
                {branches
                  .filter((branch) => branch.id !== userBranch?.id) // Exclude user's branch
                  .map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity ({material?.unit})</Label>
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
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
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
              Initiate Transfer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialTransferDialog;
