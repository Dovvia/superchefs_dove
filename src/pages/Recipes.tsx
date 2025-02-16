import { useQuery } from "@tanstack/react-query";
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
import { ScrollText, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom"; // Assuming you are using react-router for navigation

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
  description: string | null;
  product: {
    name: string;
  };
  recipe_materials: RecipeMaterial[];
}

const Recipes = () => {
  const navigate = useNavigate();
  const { data: recipes, isLoading, isError, error } = useQuery({
    queryKey: ["recipes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_recipes")
        .select(`
          *,
          product:products(name),
          recipe_materials(
            id,
            material_id,
            quantity,
            material:materials(name, unit)
          )
        `);

      if (error) throw error;
      return data as Recipe[];
    },
  });

  const handleCreateRecipe = () => {
    navigate("/create-recipe"); // Navigate to the create recipe page
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Production Recipes</h1>
        <button
          onClick={handleCreateRecipe}
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Create Recipe
        </button>
      </div>
      {isLoading && <p>Loading...</p>}
      {isError && <p>Error: {error.message}</p>}
      {recipes && recipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <Card key={recipe.id} className="shadow-md">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ScrollText className="h-5 w-5" />
                  <CardTitle>{recipe.name}</CardTitle>
                </div>
                <CardDescription>
                  Product: {recipe.product.name}
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
    </div>
  );
};

export default Recipes;