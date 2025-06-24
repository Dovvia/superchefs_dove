import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@mui/material";
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
import { useToast } from "@/hooks/use-toast";
import { Unit } from "../ui/unit";
import { Trash2 } from "lucide-react";

// Add a type to RecipeMaterial to distinguish between material and product
interface RecipeMaterial {
  id: string;
  material_id: string; // for materials
  product_id?: string; // for products used as materials
  quantity: number;
  material: {
    name: string;
    unit: string;
    unit_price: number;
  };
  yield: number;
  type: "material" | "product";
}

interface CreateRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onError: (error: Error) => void;
}

const CreateRecipeDialog: React.FC<CreateRecipeDialogProps> = ({
  open,
  onOpenChange,
  onError,
}) => {
  const { toast } = useToast();
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
      type: "material",
    },
  ]);
  const [allMaterialOptions, setAllMaterialOptions] = useState<
    Array<{
      id: string;
      name: string;
      unit: string;
      unit_price: number;
      type: "material" | "product";
    }>
  >([]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from("products").select("*");
      if (error) throw error;
      if (data) setProducts(data);
    } catch (error) {
      console.error("Error fetching products", error.message);
    }
  };

  // Fetch both materials and products for use as materials
  const fetchMaterialOptions = async () => {
    try {
      const { data: materialsData, error: materialsError } = await supabase
        .from("materials")
        .select("*");
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*");
      if (materialsError || productsError)
        throw materialsError || productsError;
      const materialOptions = (materialsData || []).map((mat) => ({
        id: mat.id,
        name: mat.name,
        unit: mat.unit,
        unit_price: mat.unit_price,
        type: "material" as const,
      }));
      const productOptions = (productsData || []).map((prod) => ({
        id: prod.id,
        name: prod.name,
        unit: prod.unit || "", // ensure your products have a unit field, or handle accordingly
        unit_price: prod.price || 0,
        type: "product" as const,
      }));
      setAllMaterialOptions([...materialOptions, ...productOptions]);
    } catch (error) {
      console.error("Error fetching material options", error.message);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchMaterialOptions();
  }, []);

  const addMaterialField = () => {
    setSelectedMaterials([
      ...selectedMaterials,
      {
        id: "",
        material_id: undefined,
        product_id: undefined,
        quantity: 0,
        material: {
          name: "",
          unit: "",
          unit_price: 0,
        },
        yield: selectedMaterials[0]?.yield || 0,
        type: "material",
      },
    ]);
  };

  const removeMaterialField = (index: number) => {
    if (index < 0 || index >= selectedMaterials.length) return;
    const updatedMaterials = selectedMaterials.filter((_, i) => i !== index);
    setSelectedMaterials(updatedMaterials);
  };

  // Update handleMaterialChange to handle both types
  const handleMaterialChange = (
    index: number,
    field: keyof RecipeMaterial,
    value: string | number
  ) => {
    const updatedMaterials = [...selectedMaterials];

    if (field === "material_id") {
      const selectedOption = allMaterialOptions.find((opt) => opt.id === value);
      if (selectedOption) {
        updatedMaterials[index].material = {
          name: selectedOption.name,
          unit: selectedOption.unit,
          unit_price: selectedOption.unit_price,
        };
        updatedMaterials[index].type = selectedOption.type;
        if (selectedOption.type === "material") {
          updatedMaterials[index].material_id = selectedOption.id;
          updatedMaterials[index].product_id = undefined; // <-- use undefined, not ""
        } else {
          updatedMaterials[index].product_id = selectedOption.id;
          updatedMaterials[index].material_id = undefined; // <-- use undefined, not ""
        }
      }
    }

    updatedMaterials[index][field] = value as never;
    setSelectedMaterials(updatedMaterials);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !selectedProduct ||
      selectedMaterials.some(
        (material) =>
          (!material.material_id && !material.product_id) ||
          material.quantity === 0 ||
          material.yield === 0
      )
    ) {
      alert("Please fill in all fields");
      return;
    }

    const selectedProductData = products.find((p) => p.id === selectedProduct);
    const yields = selectedMaterials[0]?.yield || 0;
    const materialCost = selectedMaterials.reduce(
      (total, material) =>
        total + (material.material.unit_price * material.quantity || 0),
      0
    );
    const { error: recipeError } = await supabase
      .from("product_recipes")
      .insert({
        product_id: selectedProduct,
        name: `${selectedProductData?.name || "Unknown Product"} Recipe`,
        yield: yields,
        material_cost: materialCost,
        unit_cost: materialCost / yields,
        selling_price: selectedProductData?.price || 0,
      });

    if (recipeError) {
      console.log("Error inserting recipe:", recipeError.message);
      toast({
        title: "Error",
        description: "An error occurred while creating the recipe",
        variant: "destructive",
      });
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
      toast({
        title: "Error",
        description: "An error occurred while retrieving the recipe ID",
        variant: "destructive",
      });
      return;
    }

    const recipeId = recipeData[0].id;

    // Now map recipeEntries using recipeId
    const recipeEntries = selectedMaterials
      .filter(
        (material) =>
          (material.material_id || material.product_id) &&
          material.quantity > 0 &&
          material.yield > 0
      )
      .map((material) => {
        const materialCost =
          material.material.unit_price * material.quantity || 0;
        return {
          name: material.material?.name || "",
          recipe_id: recipeId,
          material_id:
            material.type === "material" ? material.material_id || null : null,
          product_id:
            material.type === "product" ? material.product_id || null : null,
          quantity: material.quantity,
          material_cost: materialCost,
          yield: material.yield,
        };
      });

    const { error: recipeMaterialsError } = await supabase
      .from("recipe_materials")
      .insert(recipeEntries);

    if (recipeMaterialsError) {
      console.log(
        "Error inserting recipe materials:",
        recipeMaterialsError.message
      );
      toast({
        title: "Error",
        description:
          "An error occurred while inserting materials to the recipe",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Recipe created successfully",
    });
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
        type: "material",
      },
    ]);
    setSelectedProduct("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)}>
      <DialogTitle>
        <strong>Create Recipe</strong>
      </DialogTitle>
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
              <SelectContent
                style={{ zIndex: 1500, maxHeight: "250px", overflowY: "auto" }}
              >
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
            <div className="flex w-full justify-around p-1">
              <Label>Materials</Label>
              <Label>Quantity</Label>
              <Label>Yield</Label>
            </div>

            {selectedMaterials.map((material, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Select
                  value={material.material_id || material.product_id || ""}
                  onValueChange={(value) =>
                    handleMaterialChange(index, "material_id", value)
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a material or product" />
                  </SelectTrigger>
                  <SelectContent
                    style={{
                      zIndex: 1500,
                      maxHeight: "250px",
                      overflowY: "auto",
                    }}
                  >
                    {/* Materials label */}
                    <div
                      style={{
                        fontWeight: "bold",
                        padding: "4px 8px",
                        position: "sticky",
                        top: 0,
                        background: "#fff",
                        zIndex: 1,
                      }}
                    >
                      Materials
                    </div>
                    {allMaterialOptions
                      .filter((opt) => opt.type === "material")
                      .map((mat) => (
                        <SelectItem key={mat.id} value={mat.id}>
                          {mat.name} <Unit unit={mat.unit} />
                        </SelectItem>
                      ))}
                    {/* Products label */}
                    <div
                      style={{
                        fontWeight: "bold",
                        padding: "4px 8px",
                        position: "sticky",
                        top: 0,
                        background: "#fff",
                        zIndex: 1,
                      }}
                    >
                      Products
                    </div>
                    {allMaterialOptions
                      .filter((opt) => opt.type === "product")
                      .map((prod) => (
                        <SelectItem
                          className="bg-gray-200"
                          key={prod.id}
                          value={prod.id}
                        >
                          {prod.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                <Input
                  className=""
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
                    style={{ position: "absolute", right: "10px" }}
                    type="button"
                    variant="text"
                    color="error"
                    size="small"
                    className="mt-2"
                    onClick={() => removeMaterialField(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="text"
              sx={{ height: "25px", color: "#4CAF50" }}
              onClick={addMaterialField}
            >
              + Add Material
            </Button>
            <br />
            <Button
              type="submit"
              variant="contained"
              sx={{ width: "100%", backgroundColor: "#4CAF50" }}
            >
              Create Recipe
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRecipeDialog;
