import { useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText,
} from "@mui/material";
import { toast } from "sonner";
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
import { Package, Layers, Utensils } from "lucide-react";
import { sendNotification } from "@/utils/notifications";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ProductInventory, Inventory } from "@/types/inventory";

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
  description: string | null;
  product: {
    name: string;
    id: string;
  };
  recipe_materials: RecipeMaterial[];
}

const Production = () => {
  const queryClient = useQueryClient();

  const { data: recipes, isLoading } = useQuery({
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
      return data as unknown as Recipe[];
    },
  });

  const produceMutation = useMutation({
    mutationFn: async (recipe: Recipe) => {
      console.log("starting production process for", recipe.name);
      alert("Production started for " + recipe.name);

      try {
        //Get current product inventory record
        const { data: productInvData, error: productInvQueryError } =
          await supabase
            .from("product_inventory")
            .select("*")
            .eq("product_id", recipe.product.id)
            .maybeSingle();

        if (productInvQueryError) {
          console.log(
            "Error fetching product inventory:",
            productInvQueryError
          );
          throw productInvQueryError;
        }

        console.log("product inventory data", productInvData);

        //update or create product inventory record
        if (productInvData) {
          // update exixting record
          const newProduction = (productInvData.production || 0) + recipe.yield;
          console.log(
            `updating production from ${productInvData.production} to ${newProduction}`
          );

          const { error: productUpdateError } = await supabase
            .from("product_inventory")
            .update({ production: newProduction })



            .eq("id", productInvData.id);

          if (productUpdateError) {
            console.log(
              "Error updating product inventory:",
              productUpdateError
            );
            throw productUpdateError;
          }
        } else {
          // Create new record
          console.log(
            "creating new product inventory record with production:",
            recipe.yield
          );

          const { error: productCreateError } = await supabase
            .from("product_inventory")
            .insert({
              product_id: recipe.product.id,
              production: recipe.yield,
              opening_stock: 0,
            });

          if (productCreateError) {
            console.log(
              "Error creating product inventory:",
              productCreateError
            );
            throw productCreateError;
          }
        }

        //update material inventory for each material used
        for (const material of recipe.recipe_materials) {
          console.log(
            `processing material: ${material.material.name}, quantity: ${material.quantity}`
          );

          //get current material inventory record
          const { data: invData, error: invQueryError } = await supabase
            .from("inventory")
            .select("id, quantity, usage")
            .eq("material_id", material.material_id)
            .maybeSingle();

          if (invQueryError) {
            console.log(
              `Error fetching inventory for material ${material.material.name}:`,
              invQueryError
            );
            throw invQueryError;
          }

          if (!invData) {
            console.log(
              `No inventory record found for material ${material.material.name}`
            );
            throw new Error(
              `No inventory record found for material ${material.material.name}`
            );
          }

          console.log(
            `Current inventory for ${material.material.name}:`,
            invData
          );

          const currentUsage = invData.usage || 0;
          const currentQuantity = invData.quantity || 0;

          if (currentQuantity < material.quantity) {
            console.log(
              `Insufficient inventory for ${material.material.name} need ${material.quantity}, have ${currentQuantity}`
            );
            alert(
              `Insufficient inventory for ${material.material.name} need ${material.quantity}, have ${currentQuantity}`
            );

            throw new Error(
              `Insufficient inventory for ${material.material.name}`
            );
          }

          const newUsage = currentUsage + material.quantity;
          const newQuantity = currentQuantity - material.quantity;

          console.log(
            `Updating ${material.material.name}: usage ${currentUsage} -> ${newUsage}, quantity ${currentQuantity} -> ${newQuantity}`
          );

          //Update Inventory
          const { error: updateError } = await supabase
            .from("inventory")
            .update({
              usage: newUsage,
              quantity: newQuantity,
            })
            .eq("id", invData.id);

          if (updateError) {
            console.error(
              `Error updating inventory for ${material.material.name}:`,
              updateError
            );
            throw updateError;
          }
        }

        //Create notification for the production event
        const userSession = await supabase.auth.getSession();
        const branchId = userSession.data.session?.user.user_metadata.branch_id;

        console.log(`Creating notification for branch ID: ${branchId}`);

        if (!branchId) {
          console.warn(
            "No branch ID found in user metadata, using a placeholder"
          );
        }

        const notificationData = {
          branch_id: branchId || "00000000-0000-0000-0000-000000000000",
          title: "Production Completed",
          message: `Produced ${recipe.yield} units of ${recipe.product.name}`,
          read: false,
        };

        console.log("Creating notification:", notificationData);

        const { error: notificationError } = await supabase
          .from("notifications")
          .insert([notificationData]);

        if (notificationError) {
          console.error("Error creating notification:", notificationError);
          throw notificationError;
        }

        console.log("Production process completed succcessfully");
        return recipe;
  
      } catch (error) {
        console.error("Production process failed:", error);
        throw error;
      }
    },
    onSuccess: (recipe) => {
      toast.success(
        `produced ${recipe.yield || 0} units of ${recipe.product.name}`
      );
      //refresh queries to show updated inventory
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["product_inventory"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: any) => {
      console.error("Production error", error);
      toast.error(
        error.message ||
          "Failed to complete production. Please check inventory levels"
      );
    },
  });

  const handleProduce = (recipe: Recipe) => {
    console.log("Production requested for:", recipe.name);
    produceMutation.mutate(recipe);
    handleClose();
  }

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Utensils className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Production</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {recipes?.map((recipe) => (
          <Card key={recipe.id} className="shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <CardTitle>{recipe.product.name}</CardTitle>
              </div>
              <CardDescription>
                {recipe.description && <p>{recipe.description}</p>}
                Yield: {recipe.yield} units
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
          <Button onClick={() => handleProduce(selectedProduct!)} variant="default"
          disabled={produceMutation.isPending && produceMutation.variables?.id === selectedProduct?.id}
          
          >
            {(produceMutation.isPending && produceMutation.variables?.id === selectedProduct.id) ? "Processing" : "Produce"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Production;
