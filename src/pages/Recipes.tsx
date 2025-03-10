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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollText, UserPlus, Edit } from "lucide-react";
import CreateRecipeDialog from "@/components/products/CreateRecipeDialog";
import {
  Dialog,
  DialogContent,
  DialogClose,
  X,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Unit } from "@/components/ui/unit";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast(); // Use the useToast hook

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
      // Update the product_recipes table
      const { data: recipeData, error: recipeError } = await supabase
        .from("product_recipes")
        .update({
          name: updatedRecipe.name,
          description: updatedRecipe.description,
          yield: updatedRecipe.yield,
        })
        .eq("id", updatedRecipe.id)
        .select()
        .single();

      if (recipeError) throw recipeError;

      // Delete existing materials from recipe_materials table
      const { error: rmError } = await supabase
        .from("recipe_materials")
        .delete()
        .eq("recipe_id", updatedRecipe.id);

      if (rmError) throw rmError;

      // Insert updated materials into recipe_materials table
      const materialInserts = updatedRecipe.recipe_materials.map(
        (material) => ({
          recipe_id: updatedRecipe.id,
          material_id: material.material_id,
          quantity: material.quantity,
          yield: material.yield,
        })
      );

      const { error: insertError } = await supabase
        .from("recipe_materials")
        .insert(materialInserts);

      if (insertError) throw insertError;

      return { ...updatedRecipe, ...recipeData };
    },
    onSuccess: (updatedRecipe) => {
      queryClient.setQueryData<Recipe[]>(["recipes"], (oldRecipes) =>
        oldRecipes.map((recipe) =>
          recipe.id === updatedRecipe.id ? updatedRecipe : recipe
        )
      );
      setEditingRecipe(null);
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      toast({ title: "Success", description: "Recipe updated successfully" }); // Show success toast
    },
    onError: (error) => {
      console.error("Error updating recipe:", error);

      toast({
        title: "Error",
        description: `Error updating recipe: ${error.message}`,
        variant: "destructive",
      }); // Show error toast
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
                  <Button
                    style={{ marginLeft: "auto" }}
                    onClick={() => handleEdit(recipe)}
                    size="sm"
                  >
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

          toast({
            title: "Error",
            description: "An error occurred. Please try again.",
          }); // Show error toast
        }}
      />
      {editingRecipe && (
        <Dialog
          open={Boolean(editingRecipe)}
          onOpenChange={(open) => (open ? null : setEditingRecipe(null))}
        >
          <DialogHeader className="flex items-center justify-between">
            <DialogTitle>Edit Recipe</DialogTitle>
            <DialogClose asChild>
              <Button onClick={() => setEditingRecipe(null)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </DialogHeader>
          <DialogContent>
            <Input
              className="w-2/3"
              value={editingRecipe.name}
              readOnly={true}
              placeholder="Recipe Name"
            />
            <div className="mt-4">
              <h2 className="text-lg font-bold">Materials</h2>
              <div className="space-y-2">
                {editingRecipe.recipe_materials.map((material) => (
                  <div
                    key={material.id}
                    className="flex justify-between items-center py-1 border-b"
                  >
                    <span>
                      {material.material.name}{" "}
                      <Unit unit={material.material.unit} />
                    </span>
                    <div className="w-1/4">
                      <Input
                        type="number"
                        value={material.quantity}
                        onChange={(e) =>
                          setEditingRecipe({
                            ...editingRecipe,
                            recipe_materials:
                              editingRecipe.recipe_materials.map((m) =>
                                m.id === material.id
                                  ? { ...m, quantity: Number(e.target.value) }
                                  : m
                              ),
                          })
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
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
