import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollText, Edit, Plus, X, Trash2 } from "lucide-react";
import CreateRecipeDialog from "@/components/products/CreateRecipeDialog";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {Select, SelectTrigger, SelectContent, SelectItem} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Unit } from "@/components/ui/unit";
import { useToast } from "@/hooks/use-toast";

interface RecipeMaterial {
  id?: string; // Make id optional for new materials
  material_id: string;
  quantity: number;
  material: {
    name: string;
    unit: string;
    unit_price: number;
  };
  yield: number;
  [key: string]:
    | string
    | number
    | { name: string; unit: string; unit_price: number }
    | undefined;
}

interface Recipe {
  yield: number;
  id: string;
  name: string;
  description: string | null;
  product: {
    price: any;
    name: string;
    id: string;
  };
  recipe_materials: RecipeMaterial[];
}

function AddMaterialForm({
  onAdd,
}: {
  onAdd: (material: RecipeMaterial) => void;
}) {
  const [materialId, setMaterialId] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Fetch materials from Supabase
  const {
    data: materialsList,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("materials")
        .select("id, name, unit, unit_price");
      if (error) throw error;
      return data as {
        id: string;
        name: string;
        unit: string;
        unit_price: number;
      }[];
    },
  });

  const selectedMaterial = materialsList?.find((m) => m.id === materialId);

  return (
    <div className="flex gap-2 items-center mt-4">
      {isLoading ? (
        <span>Loading materials...</span>
      ) : isError ? (
        <span className="text-red-500">Error loading materials</span>
      ) : (
        <Select value={materialId} onValueChange={setMaterialId}>
          <SelectTrigger className="border rounded px-2 py-1 w-48">
            {materialId
              ? materialsList?.find((m) => m.id === materialId)?.name || "Select Material"
              : "Select Material"}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Select Material">Select Material</SelectItem>
            {materialsList?.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Input
        type="number"
        min={1}
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        placeholder="Quantity"
        className="w-24"
      />
      <Button
        size="sm"
        onClick={() => {
          if (!selectedMaterial || !quantity) return;
          onAdd({
            material_id: selectedMaterial.id,
            quantity,
            yield: 1,
            material: {
              name: selectedMaterial.name,
              unit: selectedMaterial.unit,
              unit_price: selectedMaterial.unit_price,
            },
          } as RecipeMaterial);
          setMaterialId("");
          setQuantity(1);
        }}
        disabled={!selectedMaterial}
      >
        + Add
      </Button>
    </div>
  );
}

const Recipes = () => {
  const queryClient = useQueryClient();
  const [isCreateRecipeOpen, setIsCreateRecipeOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const { toast } = useToast();

  const {
    data: recipes,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["recipes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("product_recipes").select(`
          *,
          product:products(name, price, id),
          recipe_materials(
            id,
            material_id,
            quantity,
            yield,
            material:materials(name, unit, unit_price)
          )
        `);

      if (error) throw error;
      return data as unknown as Recipe[];
    },
  });

  const updateRecipeMutation = useMutation<Recipe, Error, Recipe>({
    mutationFn: async (updatedRecipe: Recipe): Promise<Recipe> => {
      const cost = updatedRecipe.recipe_materials.reduce(
        (total, material) =>
          total + material.material.unit_price * material.quantity,
        0
      );

      const { data: recipeData, error: recipeError } = await supabase
        .from("product_recipes")
        .update({
          name: updatedRecipe.name,
          description: updatedRecipe.description,
          yield: updatedRecipe.yield,
          selling_price: updatedRecipe.product.price,
          unit_cost: cost / updatedRecipe.yield,
          material_cost: cost,
        })
        .eq("id", updatedRecipe.id)
        .select()
        .single();

      if (recipeError) throw recipeError;

      // Delete existing materials
      const { error: rmError } = await supabase
        .from("recipe_materials")
        .delete()
        .eq("recipe_id", updatedRecipe.id);

      if (rmError) throw rmError;

      // Insert updated materials
      const materialInserts = updatedRecipe.recipe_materials.map(
        (material) => ({
          recipe_id: updatedRecipe.id,
          material_id: material.material_id,
          quantity: material.quantity,
          yield: material.yield,
          material_cost: material.material.unit_price,
          name: material.material.name,
        })
      );

      const { error: insertError } = await supabase
        .from("recipe_materials")
        .insert(materialInserts);

      if (insertError) throw insertError;

      return { ...updatedRecipe, ...recipeData };
    },
    onSuccess: (updatedRecipe) => {
      queryClient.setQueryData<Recipe[]>(["recipes"], (oldRecipes = []) =>
        oldRecipes.map((recipe) =>
          recipe.id === updatedRecipe.id ? updatedRecipe : recipe
        )
      );
      setEditingRecipe(null);
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      toast({ title: "Success", description: "Recipe updated successfully" });
    },
    onError: (error) => {
      console.error("Error updating recipe:", error);
      toast({
        title: "Error",
        description: `Error updating recipe: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe({ ...recipe });
  };

  const handleUpdate = () => {
    if (editingRecipe) {
      updateRecipeMutation.mutate(editingRecipe);
    }
  };

  return (
    <div className="space-y-6 p-3 bg-white rounded-lg shadow-md w-full mx-auto margin-100">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Recipes</h1>
        <Button
          onClick={() => setIsCreateRecipeOpen(true)}
          className="ml-auto bg-transparent text-green-600 hover:bg-green-50"
        >
          <Plus className="h-4 w-4" />
          Add Recipe
        </Button>
      </div>
      {isLoading && <p>Loading... </p>}
      {isError && <p>Error: {error.message}</p>}
      {recipes && recipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <Card key={recipe.id} className="shadow-md">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ScrollText className="h-5 w-5" />
                  <CardTitle>{recipe.product.name}</CardTitle>
                  <Button
                    className="ml-auto bg-transparent text-green-600 hover:bg-green-50"
                    onClick={() => handleEdit(recipe)}
                    size="sm"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  {recipe.description && <p>{recipe.description}</p>}
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    {recipe.recipe_materials.length} items
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <details>
                  <summary className="w-1/4 cursor-pointer hover:text-green-700">
                    <span className="font-medium">Materials</span>
                  </summary>
                  <div className="space-y-2">
                    {recipe.recipe_materials.map((material) => (
                      <div
                        key={material.id}
                        className="flex justify-between items-center py-1 border-b"
                      >
                        <span>{material.material.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {material.quantity} {material.material.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex bg-green-700 items-end justify-center h-5 w-1/2 gap-1 border rounded-md p-0 mt-4 shadow-md">
                    <span className="text-sm text-white">
                      Yield = <strong>{recipe.yield}</strong>
                    </span>
                  </div>
                </details>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p>No recipes found.</p>
      )}
      <CreateRecipeDialog
        open={isCreateRecipeOpen}
        onOpenChange={setIsCreateRecipeOpen}
        onError={(error) => {
          console.error("Dialog error:", error);
          toast({
            title: "Error",
            description: "An error occurred. Please try again.",
          });
        }}
      />
      {editingRecipe && (
        <Dialog
          open={Boolean(editingRecipe)}
          onOpenChange={(open) => {
            if (!open) setEditingRecipe(null);
          }}
        >
          <DialogContent style={{ height: "80vh", overflowY: "auto" }}>
            <DialogHeader className="flex items-center justify-between">
              <DialogTitle>Edit Recipe</DialogTitle>
            </DialogHeader>
            <Input
              className="w-2/3"
              value={editingRecipe.name}
              readOnly={true}
              placeholder="Recipe Name"
            />
            <div className="mt-4">
              <h2 className="text-lg font-bold">Materials</h2>
              <div className="space-y-2">
                {editingRecipe.recipe_materials.map((material, idx) => (
                  <div
                    key={material.id || idx}
                    className="flex justify-between bg-gray-100 pl-4 items-center py-1 border-b rounded gap-2"
                  >
                    <span>
                      {material.material.name}{" "}
                      <Unit unit={material.material.unit} />
                    </span>
                    <div className="flex items-end justify-end w-3/4">
                    <div className="w-1/2">
                      <Input
                        type="number"
                        value={material.quantity}
                        onChange={(e) =>
                          setEditingRecipe({
                            ...editingRecipe,
                            recipe_materials:
                              editingRecipe.recipe_materials.map((m, i) =>
                                i === idx
                                  ? { ...m, quantity: Number(e.target.value) }
                                  : m
                              ),
                          })
                        }
                      />
                    </div>
                    <Button
                      className="bg-transparent text-red-500 hover:bg-transparent hover:text-red-600"
                      size="sm"
                      onClick={() => {
                        setEditingRecipe({
                          ...editingRecipe,
                          recipe_materials:
                            editingRecipe.recipe_materials.filter(
                              (_, i) => i !== idx
                            ),
                        });
                      }}
                    >
                      <Trash2 className="bg-transparent" />
                    </Button>
                    </div>
                  </div>
                ))}
              </div>
              <AddMaterialForm
                onAdd={(newMaterial) => {
                  setEditingRecipe({
                    ...editingRecipe,
                    recipe_materials: [
                      ...editingRecipe.recipe_materials,
                      newMaterial,
                    ],
                  });
                }}
              />
              <div className="flex items-center justify-center w-1/2 gap-1 mt-4">
                Yield{" "}
                <strong className="w-1/3">
                  <Input
                    type="number"
                    value={editingRecipe.yield}
                    onChange={(e) =>
                      setEditingRecipe({
                        ...editingRecipe,
                        yield: Number(e.target.value),
                      })
                    }
                  />
                </strong>
              </div>
            </div>
            <Button
              onClick={() => {
                handleUpdate();
                setEditingRecipe(null);
                queryClient.invalidateQueries({ queryKey: ["recipes"] });
              }}
              className="mt-4"
            >
              Update Recipe
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Recipes;
