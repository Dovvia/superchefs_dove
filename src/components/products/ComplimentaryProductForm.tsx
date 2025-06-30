import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { Textarea } from "@/components/ui/textarea";
import { Product } from "@/types/products";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";

const formSchema = z.object({
  product: z.string().min(1, "Please select a product"),
  quantity: z
    .string()
    .min(1, "Quantity is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Quantity must be greater than zero",
    }),
  reason: z.string().min(1, "Reason is required"),
  recipient: z.string().min(1, "Recipient is required"),
  branch_id: z.string().optional(),
});

interface ExtendedProduct extends Product {
  quantity?: number;
}

interface ComplimentaryProductFormProps {
  products: ExtendedProduct[];
  onSubmit: (values: z.infer<typeof formSchema>) => Promise<void>;
  isLoading?: boolean;
  onCancel: () => void;
}

export const ComplimentaryProductForm = ({
  products,
  onSubmit,
  isLoading,
  onCancel,
}: ComplimentaryProductFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      product: "",
      branch_id: "",
      quantity: "",
      reason: "",
      recipient: "",
    },
  });

  const [productQuantities, setProductQuantities] = useState<
  Record<string, number>
>({});
  useEffect(() => {
    // Fetch product quantities from the product_inventory table
    const fetchQuantities = async () => {
      const { data, error } = await supabase
        .from("product_inventory")
        .select("product_id, quantity");

      if (error) {
        console.error("Error fetching product quantities:", error);
        return;
      }

      // Map quantities to product IDs
      const quantities = data.reduce((acc, item) => {
        acc[item.product_id] = item.quantity;
        return acc;
      }, {} as Record<string, number>);

      setProductQuantities(quantities);
    };

    fetchQuantities();
  }, []);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="product"
          render={({ field }) => (
            <FormItem ref={field.ref}>
              <FormLabel htmlFor="product" withAsterisk>
                Product
              </FormLabel>
              <FormControl id="product">
                <Select
                  {...field}
                  onValueChange={(e) => {
                    const product = products?.find(
                      (product) => product?.id === e
                    );
                    form.setValue("product", e);
                    form.setValue("branch_id", product?.branch_id);
                    field.onChange(e);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
        {products?.map((product) => {
          const quantity = productQuantities[product.id] || 0;
          return (
            <SelectItem
              key={product.id}
              value={product.id}
              disabled={quantity <= 0}
            >
              {product.name} - ₦{product.price} ({quantity > 5 ? `${quantity}` : quantity > 0 ? `${quantity} low stock` : "Out of stock"})
            </SelectItem>
          );
        })}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel withAsterisk>Quantity</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  {...field}
                  placeholder="Enter quantity"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel withAsterisk>Reason</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="recipient"
          render={({ field }) => (
            <FormItem>
              <FormLabel withAsterisk>Recipient</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <div className="flex justify-center items-center">Recording...
      <div className="animate-spin rounded-full text-green-500 h-8 w-8 border-t-2 border-b-2  border-white"></div>
    </div> : "Record Complimentary"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
