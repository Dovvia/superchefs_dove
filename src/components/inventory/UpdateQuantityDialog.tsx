import { useState, useEffect } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface UpdateQuantityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const UpdateQuantityDialog = ({ open, onOpenChange, onSuccess }: UpdateQuantityDialogProps) => {
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [materials, setMaterials] = useState<{ id: string; name: string }[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [currentQuantity, setCurrentQuantity] = useState<number | null>(null);
  const [newQuantity, setNewQuantity] = useState<number | "">("");
  const {toast} = useToast();
  
  // Fetch branches and materials
  useEffect(() => {
    const fetchBranchesAndMaterials = async () => {
        
      const { data: branchData, error: branchError } = await supabase.from("branches").select("*");
      const { data: materialData, error: materialError } = await supabase.from("materials").select("*");

      if (branchError || materialError) {
        toast({ title: "Error fetching data", description: branchError?.message || materialError?.message, variant: "destructive" });
        return;
      }

      setBranches(branchData || []);
      setMaterials(materialData || []);
    };

    fetchBranchesAndMaterials();
  }, []);

  // Fetch current quantity when branch or material changes
  useEffect(() => {
    const fetchCurrentQuantity = async () => {
      if (!selectedBranch || !selectedMaterial) return;

      const { data, error } = await supabase
        .from("inventory")
        .select("quantity")
        .eq("branch_id", selectedBranch)
        .eq("material_id", selectedMaterial)
        .single();

      if (error) {
        setCurrentQuantity(null);
        toast({ title: "Error fetching quantity", description: error.message, variant: "destructive" });
        return;
      }

      setCurrentQuantity(data?.quantity || 0);
    };

    fetchCurrentQuantity();
  }, [selectedBranch, selectedMaterial]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedBranch || !selectedMaterial || newQuantity === "") {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("inventory")
      .upsert({ branch_id: selectedBranch, material_id: selectedMaterial, quantity: newQuantity }, { onConflict: "branch_id,material_id" });

    if (error) {
      toast({ title: "Error updating quantity", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Quantity updated successfully", variant: "default" });
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <h2 className="text-xl font-bold">Update Material Quantity</h2>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
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

          <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Material" />
            </SelectTrigger>
            <SelectContent>
              {materials.map((material) => (
                <SelectItem key={material.id} value={material.id}>
                  {material.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div>
            <label className="block text-sm font-medium">Current Quantity</label>
            <Input value={currentQuantity !== null ? currentQuantity : "N/A"} readOnly />
          </div>

          <div>
            <label className="block text-sm font-medium">New Quantity</label>
            <Input
              type="number"
              value={newQuantity}
              onChange={(e) => setNewQuantity(Number(e.target.value))}
              placeholder="Enter new quantity"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Update</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateQuantityDialog;