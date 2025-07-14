import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import React, { useState, useMemo } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Product } from "@/types/products";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const formSchema = z.object({
  product: z.string().min(1, "Please select a product"),
  branch: z.string().optional(),
  quantity: z
    .string()
    .min(1, "Quantity is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Quantity must be greater than zero",
    }),
  reason: z.string().min(1, "Reason is required"),
});

interface ExtendedProduct extends Product {
  product_damages?: { quantity: number }[];
}

interface ProductDamageFormProps {
  products: ExtendedProduct[];
  onSubmit: (values: z.infer<typeof formSchema>) => Promise<void>;
  isLoading?: boolean;
  onCancel: () => void;
  branchId: string; // Required for inventory check
}

export const ProductDamageForm = ({
  products,
  onSubmit,
  isLoading,
  onCancel,
  branchId,
}: ProductDamageFormProps) => {
  const [insufficientItems, setInsufficientItems] = useState<
    Array<{ name: string; needed: number; available: number }>
  >([]);
  const [showInsufficientDialog, setShowInsufficientDialog] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: "",
      reason: "",
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

  const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
    const productId = values.product;
    const requestedQty = parseFloat(values.quantity);
    const product = products.find((p) => p.id === productId);

    if (!product) {
      form.setError("product", { message: "Product not found" });
      return;
    }

    const available = productQtyMap[productId] ?? 0;

    if (requestedQty > available) {
      setInsufficientItems([
        {
          name: product.name,
          needed: requestedQty,
          available,
        },
      ]);
      setShowInsufficientDialog(true);
      return;
    }

    await onSubmit(values);
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
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
                      const product = products?.find(
                        (product) => product?.id === e
                      );
                      form.setValue("product", e);
                      form.setValue("branch", product?.branch_id || "");
                      field.onChange(e);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((product) => (
                        <SelectItem
                          key={product.id}
                          value={product.id}
                          disabled={!!product?.product_damages?.length}
                        >
                          {product.name} - ₦{product.price}
                        </SelectItem>
                      ))}
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
                    placeholder="Enter damaged quantity"
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
                  <Textarea
                    {...field}
                    placeholder="Enter a reason for the damage..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <small className="text-red-500">
              Please ensure that you have enough products for this action.
            </small>
          </div>

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
                "Record Damage"
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Alert Dialog for Insufficient Stock */}
      <AlertDialog open={showInsufficientDialog} onOpenChange={setShowInsufficientDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              ⚠️ Insufficient Inventory
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cannot record damage. The following item is out of stock:
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            {insufficientItems.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="font-medium">{item.name}</span>
                <span>
                  Needed:{" "}
                  <span className="text-red-600">{item.needed.toFixed(2)}</span>{" "}
                  | Available:{" "}
                  <span className="text-green-600">{item.available.toFixed(2)}</span>
                </span>
              </div>
            ))}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowInsufficientDialog(false)}>
              Close
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};