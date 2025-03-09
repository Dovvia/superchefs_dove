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
import currency from "currency.js";
import { Value } from "@radix-ui/react-select";

const saleItemSchema = z.object({
  product_id: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unit_price: z.coerce.number().min(0, "Price must be positive"),
});

export const formSchema = z.object({
  payment_method: z.enum(["partner","partner", "card", "transfer"]),
  items: z.array(saleItemSchema).min(1, "At least one item is required"),
});

export type FormValues = z.infer<typeof formSchema>;

interface SaleFormProps {
  products: Product[];
  onSubmit: (values: FormValues) => Promise<void>;
  isLoading?: boolean;
  branchId: string;
}

export const SaleForm = ({ products, onSubmit, isLoading, branchId }: SaleFormProps) => {
  const [items, setItems] = useState([{ product_id: "", quantity: 1, unit_price: 0 }]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDamageDialogOpen, setIsDamageDialogOpen] = useState(false);
  const [isComplimentaryDialogOpen, setIsComplimentaryDialogOpen] = useState(false);

  const naira = (Value: number) => currency(Value, { symbol: "₦", precision: 2, separator: "," }).format();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      payment_method: "partner",
      items,
    },
  });

  const addItem = () => {
    setItems([...items, { product_id: "", quantity: 1, unit_price: 0 }]);
    form.setValue("items", [...items, { product_id: "", quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    form.setValue("items", newItems);
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        product_id: productId,
        unit_price: product.price,
      };
      setItems(newItems);
      form.setValue("items", newItems);
      setSelectedProduct(product);
    }
  };

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
                  <SelectItem value="other">Transfer</SelectItem>
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
                  <FormItem className="flex-1">
                    <Select
                      onValueChange={(value) => handleProductChange(index, value)}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - {naira(product.price)}
                          </SelectItem>
                        ))}
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
              product={selectedProduct}
            />
            <ComplimentaryProductDialog
              open={isComplimentaryDialogOpen}
              onOpenChange={setIsComplimentaryDialogOpen}
              product={selectedProduct}
              branchId={branchId}
            />
          </>
        )}

      </form>
    </Form>
  );
};