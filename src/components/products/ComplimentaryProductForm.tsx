import React, { useState, useEffect, useMemo } from "react";
import { Product } from "@/types/products";
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
import { Input as UIInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Schema for form validation
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
});

interface ExtendedProduct extends Product {
  quantity?: number;
}

interface ComplimentaryProductFormProps {
  products: ExtendedProduct[];
  onSubmit: (values: z.infer<typeof formSchema>) => Promise<void>;
  isLoading?: boolean;
  onCancel: () => void;
  branchId: string;
}

export const ComplimentaryProductForm = ({
  products,
  onSubmit,
  isLoading,
  onCancel,
  branchId,
}: ComplimentaryProductFormProps) => {
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      product: "",
      quantity: "",
      reason: "",
      recipient: "",
    },
  });

  // Fetch current product quantities
  const { data: productQtyData } = useQuery({
    queryKey: ["branch_product_today_view", branchId],
    enabled: !!branchId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branch_product_today_view")
        .select("*")
        .eq("branch_id", branchId);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000,
  });

  // Build product quantity map
  const productQtyMap = useMemo(() => {
    const map: Record<string, number> = {};
    (productQtyData || []).forEach((row: any) => {
      map[row.product_id] =
        (row.total_quantity ?? 0) +
        (row.opening_stock ?? 0) +
        (row.total_production_quantity ?? 0) +
        (row.total_transfer_in_quantity ?? 0) -
        (row.total_transfer_out_quantity ?? 0) -
        (row.total_usage_quantity ?? 0) -
        (row.total_damage_quantity ?? 0) -
        (row.total_sales_quantity ?? 0) -
        (row.total_complimentary_quantity ?? 0);
    });
    return map;
  }, [productQtyData]);

  // Update max value when product changes
  useEffect(() => {
    if (selectedProductId) {
      const available = productQtyMap[selectedProductId] ?? 0;
      form.setValue("quantity", "");
      form.unregister("quantity");
      form.register("quantity", {
        required: "Quantity is required",
        validate: (value) =>
          Number(value) <= available || "Not enough stock",
      });
    }
  }, [selectedProductId, productQtyMap]);

  const handleProductChange = (productId: string) => {
    const selectedProduct = products.find((p) => p.id === productId);
    const available = productQtyMap[productId] ?? 0;

    form.setValue("product", productId);
    form.setValue("quantity", ""); // Clear previous value
    setSelectedProductId(productId);

    // Re-validate and restrict input based on available stock
    form.unregister("quantity");
    form.register("quantity", {
      required: "Quantity is required",
      validate: (value) =>
        Number(value) <= available || "Cannot exceed available stock",
    });
  };

  const filteredProducts = useMemo(() => {
    return products.map((product) => ({
      ...product,
      currentStock: productQtyMap[product.id] ?? 0,
    }));
  }, [products, productQtyMap]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Product Selection */}
        <FormField
          control={form.control}
          name="product"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="product" withAsterisk>
                Product
              </FormLabel>
              <FormControl id="product">
                <Select
                  {...field}
                  onValueChange={(e) => {
                    handleProductChange(e);
                    field.onChange(e);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProducts.map((product) => {
                      return (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - ₦{product.price}
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

        {/* Quantity Input with Max Restriction */}
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel withAsterisk>Quantity</FormLabel>
              <FormControl>
                <UIInput
                  type="number"
                  min="1"
                  max={selectedProductId ? productQtyMap[selectedProductId] : undefined}
                  placeholder="Enter quantity"
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (selectedProductId) {
                      const available = productQtyMap[selectedProductId];
                      if (Number(value) > available) {
                        form.setError("quantity", {
                          type: "manual",
                          message: `Not Allowed! Current stock = ${available.toFixed(2)}`,
                        });
                      } else {
                        form.clearErrors("quantity");
                      }
                    }
                    field.onChange(e);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Reason Input */}
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel withAsterisk>Reason</FormLabel>
              <FormControl>
                <UIInput {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Recipient Input */}
        <FormField
          control={form.control}
          name="recipient"
          render={({ field }) => (
            <FormItem>
              <FormLabel withAsterisk>Recipient</FormLabel>
              <FormControl>
                <UIInput {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center">
                Recording...
                <div className="ml-2 animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              </div>
            ) : (
              "Record Complimentary"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};