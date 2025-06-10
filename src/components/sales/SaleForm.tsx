import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Product } from "@/types/products";
import { Plus, Trash2, PackageMinus, Gift } from "lucide-react";
import { ProductDamageDialog } from "../products/ProductDamageDialog";
import { ComplimentaryProductDialog } from "../products/ComplimentaryProductDialog";
import { naira } from "@/lib/utils";
import { Value } from "@radix-ui/react-select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const saleItemSchema = z.object({
  product_id: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unit_price: z.coerce.number().min(0, "Price must be positive"),
  unit_cost: z.coerce.number().min(0, "Cost must be positive").optional(),
});

const formSchema = z.object({
  payment_method: z.enum(["cash", "partner", "card", "transfer"]),
  branch_id: z.string().optional(),
  items: z.array(saleItemSchema).min(1, "At least one item is required"),
});

export type FormValues = z.infer<typeof formSchema>;

interface SaleFormProps {
  products: Product[];
  onSubmit: (values: FormValues) => Promise<void>;
  isLoading?: boolean;
  branchId: string;
}

export const SaleForm = ({ products, onSubmit, isLoading }: SaleFormProps) => {
  const [items, setItems] = useState([
    { product_id: "", quantity: 1, unit_price: 0, unit_cost: 0 },
  ]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDamageDialogOpen, setIsDamageDialogOpen] = useState(false);
  const [isComplimentaryDialogOpen, setIsComplimentaryDialogOpen] =
    useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // Add this line

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      payment_method: "partner",
      items,
    },
  });

  const { data: productRecipes } = useQuery({
    queryKey: ["product_recipes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_recipes")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const addItem = () => {
    setItems([
      ...items,
      { product_id: "", quantity: 1, unit_price: 0, unit_cost: 0 },
    ]);
    form.setValue("items", [
      ...items,
      { product_id: "", quantity: 1, unit_price: 0, unit_cost: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    form.setValue("items", newItems);
  };

  // Update handleProductChange to use unit_cost from product_recipes
  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    // Find the unit_cost from product_recipes
    const recipe = productRecipes?.find((r) => r.product_id === productId);
    const unitCost = recipe?.unit_cost || 0;

    if (product) {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        product_id: productId,
        unit_price: product.price,
        unit_cost: unitCost,
      };
      setItems(newItems);
      form.setValue("items", newItems);
      setSelectedProduct(product);
    }
  };

  // Filter products by search term
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="payment_method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Method</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Items</h3>
            <div className="flex gap-2">
              {selectedProduct && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDamageDialogOpen(true)}
                  >
                    <PackageMinus className="h-4 w-4 mr-2" />
                    Record Damage
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsComplimentaryDialogOpen(true)}
                  >
                    <Gift className="h-4 w-4 mr-2" />
                    Record Complimentary
                  </Button>
                </>
              )}
            </div>
          </div>

          {items.map((_, index) => (
            <div key={index} className="flex gap-4 items-start">
              <FormField
                control={form.control}
                name={`items.${index}.product_id`}
                render={({ field }) => (
                  <FormItem className="flex-1 ">
                    <Select
                      onValueChange={(value) =>
                        handleProductChange(index, value)
                      }
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="h-screen max-h-60 overflow-y-auto">
                        {/* Search input sticky at the top */}
                        <div className="sticky top-0 bg-white z-10 p-2 border-b">
                          <Input
                            placeholder="Search product..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full"
                          />
                        </div>
                        {/* Filtered product list */}
                        {filteredProducts.length > 0 ? (
                          filteredProducts.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - {naira(product.price)}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-gray-500">
                            No products found.
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`items.${index}.quantity`}
                render={({ field }) => (
                  <FormItem className="w-24">
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          const newItems = [...items];
                          newItems[index] = {
                            ...newItems[index],
                            quantity: parseInt(e.target.value) || 0,
                          };
                          setItems(newItems);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeItem(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating Sale..." : "Create Sale"}
        </Button>

        {selectedProduct && (
          <>
            <ProductDamageDialog
              open={isDamageDialogOpen}
              onOpenChange={setIsDamageDialogOpen}
              products={products}
            />
            <ComplimentaryProductDialog
              open={isComplimentaryDialogOpen}
              onOpenChange={setIsComplimentaryDialogOpen}
              products={products}
            />
          </>
        )}
      </form>
    </Form>
  );
};
