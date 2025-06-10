import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Trash2 } from "lucide-react";

interface UpdateQuantityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface MaterialField {
  material_id: string;
  current_quantity: number | null;
  new_quantity: number | "";
}

const UpdateQuantityDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: UpdateQuantityDialogProps) => {
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [materials, setMaterials] = useState<{ id: string; name: string }[]>(
    []
  );
  const [selectedBranch, setSelectedBranch] = useState<string>(""); // Single branch selection
  const [materialFields, setMaterialFields] = useState<MaterialField[]>([
    {
      material_id: "",
      current_quantity: null,
      new_quantity: "",
    },
  ]);
  const { toast } = useToast();

  // Fetch branches and materials
  useEffect(() => {
    const fetchBranchesAndMaterials = async () => {
      const { data: branchData, error: branchError } = await supabase
        .from("branches")
        .select("*");
      const { data: materialData, error: materialError } = await supabase
        .from("materials")
        .select("*");

      if (branchError || materialError) {
        toast({
          title: "Error fetching data",
          description: branchError?.message || materialError?.message,
          variant: "destructive",
        });
        return;
      }

      setBranches(branchData || []);
      setMaterials(materialData || []);
    };

    fetchBranchesAndMaterials();
  }, []);

  // Fetch current quantity for a specific branch and material
  const fetchCurrentQuantity = async (
    branch_id: string,
    material_id: string
  ) => {
    if (!branch_id || !material_id) return null;

    const { data, error } = await supabase
      .from("inventory")
      .select("quantity")
      .eq("branch_id", branch_id)
      .eq("material_id", material_id)
      .single();

    if (error) {
      toast({
        title: "Error fetching quantity",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }

    return data?.quantity || 0;
  };

  // Handle adding a new material field
  const addMaterialField = () => {
    setMaterialFields([
      ...materialFields,
      {
        material_id: "",
        current_quantity: null,
        new_quantity: "",
      },
    ]);
  };

  // Handle removing a material field
  const removeMaterialField = (index: number) => {
    if (index < 0 || index >= materialFields.length) return;
    const updatedFields = materialFields.filter((_, i) => i !== index);
    setMaterialFields(updatedFields);
  };

  // Handle updating a specific field
  const handleFieldChange = async (
    index: number,
    field: keyof MaterialField,
    value: string | number
  ) => {
    const updatedFields = [...materialFields];
    updatedFields[index][field] = value as never;

    // Fetch current quantity if material changes
    if (field === "material_id" && selectedBranch) {
      const material_id = updatedFields[index].material_id;
      if (material_id) {
        const currentQuantity = await fetchCurrentQuantity(
          selectedBranch,
          material_id
        );
        updatedFields[index].current_quantity = currentQuantity;
      }
    }

    setMaterialFields(updatedFields);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedBranch) {
      toast({
        title: "Error",
        description: "Please select a branch",
        variant: "destructive",
      });
      return;
    }

    if (
      materialFields.some(
        (field) =>
          !field.material_id ||
          field.new_quantity === "" ||
          field.new_quantity < 0
      )
    ) {
      toast({
        title: "Error",
        description: "Please fill all fields correctly",
        variant: "destructive",
      });
      return;
    }

    const updates = materialFields.map((field) => ({
      branch_id: selectedBranch,
      material_id: field.material_id,
      quantity: field.new_quantity,
    }));

    const { error } = await supabase
      .from("inventory")
      .insert(updates);

    if (error) {
      toast({
        title: "Error updating quantities",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Quantities updated successfully",
      variant: "default",
    });
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <h2 className="text-xl font-bold">Update Material Quantities</h2>
        </DialogHeader>

        {/* Branch Selection */}
        <div className="mb-4">
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
        </div>

        {/* Material Fields */}
        <div className="space-y-4">
          {materialFields.map((field, index) => (
            <div key={index} className="flex gap-4 items-center">
              <Select
                value={field.material_id}
                onValueChange={(value) =>
                  handleFieldChange(index, "material_id", value)
                }
              >
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

              <Input
                type="number"
                value={field.new_quantity}
                onChange={(e) =>
                  handleFieldChange(
                    index,
                    "new_quantity",
                    Number(e.target.value)
                  )
                }
                placeholder="New Qty"
              />

              <Input
                placeholder="Current Quantity"
                type="text"
                value={
                  field.current_quantity !== null
                    ? field.current_quantity
                    : "N/A"
                }
                readOnly
              />

              {index > 0 && (
                <Button
                  type="button"
                  onClick={() => removeMaterialField(index)}
                  style={{ color: "red", backgroundColor: "transparent", position: "absolute", right: "20px" }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button
          type="button"
          style={{ height: "25px", backgroundColor: "transparent", width: "fit-content", color:"#4CAF50" }}
          onClick={addMaterialField}
        >
          + Add Material
        </Button>

        <DialogFooter>
          <Button variant="destructive" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Update</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateQuantityDialog;
