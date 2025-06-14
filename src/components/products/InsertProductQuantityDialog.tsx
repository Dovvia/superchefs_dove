import { useState } from "react";
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

interface InsertProductQuantityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branches: { id: string; name: string }[];
  products: { id: string; name: string }[];
  onSuccess: () => void;
}

interface ProductField {
  product_id: string;
  quantity: number | "";
}

const InsertProductQuantityDialog = ({
  open,
  onOpenChange,
  branches,
  products,
  onSuccess,
}: InsertProductQuantityDialogProps) => {
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [productFields, setProductFields] = useState<ProductField[]>([
    { product_id: "", quantity: "" },
  ]);
  const { toast } = useToast();

  const addProductField = () => {
    setProductFields([...productFields, { product_id: "", quantity: "" }]);
  };

  const removeProductField = (index: number) => {
    setProductFields(productFields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (
    index: number,
    field: keyof ProductField,
    value: string | number
  ) => {
    const updatedFields = [...productFields];
    updatedFields[index][field] = value as never;
    setProductFields(updatedFields);
  };

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
      productFields.some(
        (field) =>
          !field.product_id || field.quantity === "" || field.quantity < 0
      )
    ) {
      toast({
        title: "Error",
        description: "Please fill all fields correctly",
        variant: "destructive",
      });
      return;
    }

    const updates = productFields.map((field) => ({
      branch_id: selectedBranch,
      product_id: field.product_id,
      quantity: field.quantity,
    }));

    let error = null;
    try {
      const { error: insertError } = await supabase
        .from("product_inventory")
        .insert(updates)
        .select("*")
        .single();
      error = insertError;
    } catch (err) {
      console.error("Error inserting product quantities:", err);
      error = err;
    }

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Product quantities inserted successfully",
      variant: "default",
    });
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <h2 className="text-xl font-bold">Insert Product Quantities</h2>
        </DialogHeader>

        <div className="space-y-4">
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

          {productFields.map((field, index) => (
            <div key={index} className="flex gap-4 items-center">
              <Select
                value={field.product_id}
                onValueChange={(value) =>
                  handleFieldChange(index, "product_id", value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Product" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="number"
                value={field.quantity}
                onChange={(e) =>
                  handleFieldChange(index, "quantity", Number(e.target.value))
                }
                placeholder="Enter Quantity"
              />

              {index > 0 && (
                <Button
                  type="button"
                  onClick={() => removeProductField(index)}
                  style={{
                    color: "red",
                    backgroundColor: "transparent",
                    position: "absolute",
                    right: "20px",
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          <Button
            type="button"
            style={{
              height: "25px",
              backgroundColor: "transparent",
              width: "fit-content",
              color: "#4CAF50",
            }}
            onClick={addProductField}
          >
            + Add Product
          </Button>
        </div>

        <DialogFooter className="gap-4 mt-4">
          <Button variant="destructive"  onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Insert</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InsertProductQuantityDialog;
