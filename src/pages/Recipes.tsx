import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollText, Layers, UserPlus, Edit } from "lucide-react";
import { Product } from "@/types/products";
import { Material } from "@/types/inventory";
import CreateRecipeDialog from "@/components/products/CreateRecipeDialog";
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
    name: string;
    id: string;
  };
  recipe_materials: RecipeMaterial[];
}

const Recipes = () => {
  const queryClient = useQueryClient();
  const [isCreateRecipeOpen, setIsCreateRecipeOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

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
          product:products(name),
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
      const { error } = await supabase
        .from("product_recipes")
        .update(updatedRecipe)
        .eq("id", updatedRecipe.id);
      if (error) throw error;
      return updatedRecipe;
    },
    onSuccess: (updatedRecipe) => {
      queryClient.setQueryData<Recipe[]>(["recipes"], (oldRecipes) =>
        oldRecipes.map((recipe) =>
          recipe.id === updatedRecipe.id ? updatedRecipe : recipe
        )
      );
      setEditingRecipe(null);
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Production Recipes</h1>
        <Button onClick={() => setIsCreateRecipeOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Create Recipe
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
                  <Button onClick={() => handleEdit(recipe)} size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  {recipe.description && <p>{recipe.description}</p>}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value="materials">
                    <AccordionTrigger className="flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Materials Required
                    </AccordionTrigger>
                    <AccordionContent>
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
                      <div className="flex items-end justify-center w-1/2 gap-1 border border-black">
                        Yield = <strong>{recipe.yield}</strong>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p>No recipes found.</p>
      )}
      <CreateRecipeDialog
        open={isCreateRecipeOpen}
        onOpenChange={(open) => setIsCreateRecipeOpen(open)}
        onError={(error) => {
          console.error("Dialog error:", error);
          alert("An error occurred. Please try again.");
        }}
      />
      {editingRecipe && (
        <Dialog open={Boolean(editingRecipe)}>
          <DialogHeader>
            <DialogTitle>Edit Recipe</DialogTitle>
          </DialogHeader>
          <DialogContent>
            <Input
              value={editingRecipe.name}
              onChange={(e) =>
                setEditingRecipe({ ...editingRecipe, name: e.target.value })
              }
              placeholder="Recipe Name"
            />
            <Button onClick={handleUpdate} className="mt-4">
              Update Recipe
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Recipes;

