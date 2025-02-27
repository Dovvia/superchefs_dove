import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@mui/material";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/products";
import { Material } from "@/types/inventory";
import { toast } from "sonner";
import { Unit } from "../ui/unit";

interface RecipeMaterial {
  id: string;
  material_id: string;
  quantity: number;
  material: {
    name: string;
    unit: string;
    unit_price: number;
  };
  yield: number;
}

interface CreateRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onError: (error: any) => void;
}

const CreateRecipeDialog: React.FC<CreateRecipeDialogProps> = ({
  open,
  onOpenChange,
  onError,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedMaterials, setSelectedMaterials] = useState<RecipeMaterial[]>([
    {
      id: "",
      material_id: "",
      quantity: 0,
      material: {
        name: "",
        unit: "",
        unit_price: 0,
      },
      yield: 0,
    },
  ]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from("products").select("*");
      if (error) throw error;
      if (data) setProducts(data);
    } catch (error) {
      console.error("Error fetching products", error.message);
    }
  };

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase.from("materials").select("*");
      if (error) throw error;
      if (data) setMaterials(data);
    } catch (error) {
      console.error("Error fetching materials", error.message);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchMaterials();
  }, []);

  const addMaterialField = () => {
    setSelectedMaterials([
      ...selectedMaterials,
      {
        id: "",
        material_id: "",
        quantity: 0,
        material: {
          name: "",
          unit: "",
          unit_price: 0,
        },
        yield: 0,
      },
    ]);
  };

  const removeMaterialField = (index: number) => {
    if (index < 0 || index >= selectedMaterials.length) return;
    const updatedMaterials = selectedMaterials.filter((_, i) => i !== index);
    setSelectedMaterials(updatedMaterials);
  };

  const handleMaterialChange = (
    index: number,
    field: keyof RecipeMaterial, 
    value: string | number,
  ) => {
    const updatedMaterials = [...selectedMaterials];
    if (typeof updatedMaterials[index][field] === typeof value) {
      updatedMaterials[index][field] = value as never;
      setSelectedMaterials(updatedMaterials);
    } else {
      console.warn(`Invalid value type for "${field}"`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !selectedProduct ||
      selectedMaterials.some(
        (material) => !material.material_id || material.quantity === 0 || material.yield === 0
      )
    ) {
      alert("Please fill in all fields");
      return;
    }

    const recipeEntries = selectedMaterials
      .filter((material) => material.material_id && material.quantity > 0 && material.yield > 0)
      .map((material) => ({
        product_id: selectedProduct,
        material_id: material.material_id,
        quantity: material.quantity,
        material_cost: material.material.unit_price * material.quantity || 0,
        yield: material.yield,
        name: material.material?.name || "",
      }));

    const { error: recipeError } = await supabase.from("product_recipes").insert({
      product_id: selectedProduct,
      name: `Recipe for ${products.find(p => p.id === selectedProduct)?.name || 'Unknown Product'}`,
      yield: recipeEntries[0]?.yield || 0,
    });

    if (recipeError) {
      console.log("Error inserting recipe:", recipeError.message);
      toast.error("An error occurred while creating the recipe");
      return;
    }

    const { data: recipeData, error: recipeIdError } = await supabase
      .from("product_recipes")
      .select("id")
      .eq("product_id", selectedProduct)
      .order("created_at", { ascending: false })
      .limit(1);

    if (recipeIdError || !recipeData || recipeData.length === 0) {
      console.log("Error retrieving recipe ID:", recipeIdError?.message);
      toast.error("An error occurred while creating the recipe");
      return;
    }

    const recipeId = recipeData[0].id;
    const { error: recipeMaterialsError } = await supabase.from("recipe_materials").insert(
      recipeEntries.map((material) => ({
        recipe_id: recipeId,
        material_id: material.material_id,
        quantity: material.quantity,
        material_cost: material.material_cost,
        yield: material.yield,
      }))
    );

    if (recipeMaterialsError) {
      console.log("Error inserting recipe materials:", recipeMaterialsError.message);
      toast.error("An error occurred while adding materials to the recipe");
      return;
    }

    toast.success("Recipe created successfully");
    setSelectedMaterials([
      {
        id: "",
        material_id: "",
        quantity: 0,
        material: {
          name: "",
          unit: "",
          unit_price: 0,
        },
        yield: 0,
      },
    ]);
    setSelectedProduct("");
    onOpenChange(false);
  };


  return (
    <Dialog open={open} onClose={() => onOpenChange(false)}>
      <DialogTitle><strong>Create Recipe</strong></DialogTitle>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">Product</Label>
            <Select
              value={selectedProduct}
              onValueChange={(value) => setSelectedProduct(value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent style={{ zIndex: 1500 }}>
                {products.length > 0 ? (
                  products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    No products available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Materials</Label>
            {selectedMaterials.map((material, index) => (
              <div
                key={index}
                className="flex items-center space-x-2"
              >
                <Select
                  value={material.material_id}
                  onValueChange={(value) =>
                    handleMaterialChange(index, "material_id", value)
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a material" />
                  </SelectTrigger>
                  <SelectContent style={{ zIndex: 1500 }}>
                    {materials.map((mat) => (
                      <SelectItem key={mat.id} value={mat.id}>
                        {mat.name} <Unit unit={mat.unit} /> 
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Quantity"
                  step="0.01"
                  value={material.quantity}
                  onChange={(e) =>
                    handleMaterialChange(
                      index,
                      "quantity",
                      parseFloat(e.target.value)
                    )
                  }
                  required
                />
                <Input
                  type="number"
                  placeholder="Yield"
                  step="0.01"
                  value={material.yield}
                  onChange={(e) =>
                    handleMaterialChange(
                      index,
                      "yield",
                      parseFloat(e.target.value)
                    )
                  }
                  required
                />
                {index > 0 && (
                  <Button
                    type="button"
                    variant="text"
                    onClick={() => removeMaterialField(index)}
                  >
                    ❌
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="contained" sx={{ height: "25px" }} onClick={addMaterialField}>
              + Add Material
            </Button>
            <br />
            <Button type="submit" variant="contained" sx={{ width: "100%", backgroundColor:"#4CAF50" }}>Create Recipe</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRecipeDialog;

