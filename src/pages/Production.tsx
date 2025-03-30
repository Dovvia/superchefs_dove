import { useState, useEffect } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText,
} from "@mui/material";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Package, Layers, Utensils, User } from "lucide-react";
import { useUserBranch } from "@/hooks/user-branch";
import { useProductionContext } from "@/context/ProductionContext";

interface RecipeMaterial {
  id: string;
  material_id: string;
  quantity: number;
  material: {
    name: string;
    unit: string;
  };
}

interface Recipe {
  id: string;
  name: string;
  yield: number;
  updated_at: number;
  description: string | null;
  product: {
    name: string;
    id: string;
  };
  recipe_materials: RecipeMaterial[];
}
export const productionData = async (
  recipes: Recipe[],
  branchName: string | null
) => {
  return recipes.map((recipe) => ({
    branch: branchName || "Unknown Branch",
    productName: recipe.product.name,
    yield: recipe.yield,
    timestamp: recipe.updated_at,
  }));
};

const Production = () => {
  const queryClient = useQueryClient();
  const { data: userBranch, isLoading: isBranchLoading } = useUserBranch();
  const { addProductionRecord } = useProductionContext();

  const { data: fetchedRecipes, isLoading } = useQuery<Recipe[], Error>({
    queryKey: ["recipes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("product_recipes").select(`
          id,
          name,
          production_yield as yield,
          description,
          updated_at,
          product:products(name, id),
          recipe_materials(
            id,
            material_id,
            quantity,
            material:materials(name, unit)
          )
        `);

      if (error) {
        console.error("Error fetching recipes:", error);
        throw error;
      }
      return (data as Partial<Recipe>[]).map((recipe) => ({
        ...recipe,
        yield: recipe.yield || 1, // Ensure yield is properly mapped
      })) as Recipe[];
    },
  });

  useEffect(() => {
    const fetchProductionData = async () => {
      if (
        fetchedRecipes &&
        userBranch &&
        typeof userBranch === "object" &&
        "name" in userBranch
      ) {
        const branchName = (userBranch as { name: string}).name || "Unknown Branch";
        const productionDataWithBranch = await productionData(
          fetchedRecipes,
          branchName
        );
        setRecipes(
          fetchedRecipes.map((recipe, index) => ({
            ...recipe,
            branch: productionDataWithBranch[index].branch,
          }))
        );
      } else {
        console.error("Invalid userBranch or fetchedRecipes");
      }
    };

    fetchProductionData();
  }, [fetchedRecipes, userBranch]);

  const produceMutation = useMutation({
    mutationFn: async (recipe: Recipe) => {
      console.log("Starting production process for", recipe.name);

      try {
        // Get current product inventory record
        const { data: productInvData, error: productInvQueryError } =
          await supabase
            .from("product_inventory")
            .select("*")
            .eq("product_id", recipe.product.id)
            .maybeSingle();

        if (productInvQueryError) {
          console.error(
            "Error fetching product inventory:",
            productInvQueryError
          );
          throw productInvQueryError;
        }

        let newProduction = recipe.yield;
        const timestamp = new Date().toISOString();

        // Update or create product inventory record
        if (productInvData) {
          newProduction = (productInvData.production || 0) + recipe.yield;

          const { error: productUpdateError } = await supabase
            .from("product_inventory")
            .update({ production: newProduction })
            .eq("id", productInvData.id);

          if (productUpdateError) {
            console.error(
              "Error updating product inventory:",
              productUpdateError
            );
            throw productUpdateError;
          }
        } else {
            const { error: productCreateError } = await supabase
            .from("product_inventory")
            .insert({
              product_id: recipe.product.id,
              production: recipe.yield,
              opening_stock: 0,
              name: recipe.product.name,
              // recipe_id: recipe.id, // primary id from the "product_recipes"
              branch_id: userBranch && typeof userBranch === "object" && "id" in userBranch ?
              (userBranch as { id: string }).id : "Unknown Branch",
            });

          if (productCreateError) {
            console.error(
              "Error creating product inventory:",
              productCreateError
            );
            throw productCreateError;
          }
        }

        // Insert a new record into the production table
        const { error: productionInsertError } = await supabase
          .from("production")
          .insert({
            branch_name: userBranch && typeof userBranch === "object" && "name" in  userBranch ?
            (userBranch as { name: string }).name : "Unknown Branch",
            product_name: recipe.product.name,
            yield: recipe.yield,
            timestamp,
          });

        if (productionInsertError) {
          console.error(
            "Error inserting into production table:",
            productionInsertError
          );
          throw productionInsertError;
        }

        console.log("Production process completed successfully");
        return recipe;
      } catch (error) {
        console.error("Production process failed:", error);
        throw error;
      }
    },
    onSuccess: (recipe) => {
      toast({
        title: "Production Successful",
        description: `Producing ${recipe.yield || 0} units of ${recipe.product.name}`,
      });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["product_inventory"] });
      queryClient.invalidateQueries({ queryKey: ["production"] }); // Invalidate production table query
    },
    onError: (error: any) => {
      console.error("Production error", error);
      toast({
        title: "Production Error",
        description: `Failed to produce ${error?.message || "unknown error"}`,
        variant: "destructive"  
    });
    },
  });



  const handleProduce = (recipe: Recipe) => {
    console.log("Production requested for:", recipe.name);
    produceMutation.mutate(recipe);
    handleClose();
  };

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Recipe | null>(null);

  const createDialog = (production: Recipe) => {
    setSelectedProduct(production);
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
    setSelectedProduct(null);
  };

  const handleYieldChange = (recipeId: string, newYield: number) => {
    if (newYield < 1) {
      return;
    }
    setRecipes((prevRecipes) =>
      prevRecipes.map((recipe) => {
        if (recipe.id === recipeId) {
          const yieldRatio = newYield / recipe.yield;
          return {
            ...recipe,
            yield: newYield,
            recipe_materials: recipe.recipe_materials.map((material) => ({
              ...material,
              quantity: material.quantity * yieldRatio,
            })),
          };
        }
        return recipe;
      })
    );
  };

  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useQuery({
    queryKey: ["recipes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("product_recipes").select(`
          *,
          product:products(name, id),
          recipe_materials(
            id,
            material_id,
            quantity,
            material:materials(name, unit)
          )
        `);

      if (error) throw error;
      setRecipes(data as unknown as Recipe[]);
      return data as unknown as Recipe[];
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Utensils className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Production</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {recipes.map((recipe) => (
          <Card key={recipe.id} className="shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <CardTitle>{recipe.product.name}</CardTitle>
              </div>
              <CardDescription>
                {recipe.description && <p>{recipe.description}</p>}
                <div className="flex items-center gap-2">
                  Yield:
                  <input
                    type="number"
                    value={recipe.yield}
                    onChange={(e) =>
                      handleYieldChange(recipe.id, Number(e.target.value))
                    }
                    className="w-12 border rounded px-1 text-center"
                  />
                </div>
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
                            {material.quantity.toFixed(2)}{" "}
                            {material.material.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-end justify-between w-full gap-1">
                      <span className="text-sm text-muted-foreground">
                        Click to produce 👉🏽
                      </span>
                      <Button
                        onClick={() => createDialog(recipe)}
                        style={{
                          position: "relative",
                          bottom: "-1rem",
                          right: "1rem",
                        }}
                        variant="outline"
                      >
                        produce
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={openDialog} onClose={handleClose}>
        <DialogTitle className="text-red-700">
          Producing {selectedProduct?.name} cannot be reversed!{" "}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to produce {selectedProduct?.name}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="destructive">
            Cancel
          </Button>
          <Button
            onClick={() => handleProduce(selectedProduct!)}
            variant="default"
            disabled={
              produceMutation.isPending &&
              produceMutation.variables?.id === selectedProduct?.id
            }
          >
            {produceMutation.isPending &&
            produceMutation.variables?.id === selectedProduct?.id
              ? "Processing"
              : "Produce"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Production;
