import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Product } from "@/types/products";
import { useUserBranch } from "@/hooks/user-branch";
import { Textarea } from "../ui/textarea";

//  Validation schema
const formSchema = z.object({
  product: z.string().min(1, "Please select a product"),
  toBranch: z.string().min(1, "Select destination branch"),
  quantity: z
    .string()
    .min(1, "Quantity is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Must be greater than zero",
    }),
  notes: z.string().optional(),
});

type TransferFormValues = z.infer<typeof formSchema>;

interface ProductTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  branches: Array<{ id: string; name: string }>;
  onSuccess?: () => void;
}

export const ProductTransferDialog: React.FC<ProductTransferDialogProps> = ({
  open,
  onOpenChange,
  products,
  branches,
  onSuccess,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { data: userBranch } = useUserBranch();
  const branchId = userBranch?.id;

  //  Fetch current product quantities for the user's branch
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

  //  Refetch stock when dialog opens
  useEffect(() => {
    if (open && branchId) {
      queryClient.refetchQueries({ 
        queryKey: ["branch_product_today_view", branchId] 
      });
    }
  }, [open, branchId, queryClient]);

  //  Build product quantity map
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

  //  Define form
  const form = useForm<TransferFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      product: "",
      toBranch: "",
      quantity: "",
      notes: "",
    },
  });

  // 🔁 Validate & restrict quantity when product changes
  useEffect(() => {
    if (!selectedProductId) return;
    const available = productQtyMap[selectedProductId] ?? 0;
    form.unregister("quantity");
    form.register("quantity", {
      required: "Quantity is required",
      validate: (value) =>
        Number(value) <= available || "Not enough stock",
    });
  }, [selectedProductId, productQtyMap]);

  const handleProductChange = (productId: string) => {
    const available = productQtyMap[productId] ?? 0;
    form.setValue("product", productId);
    form.setValue("quantity", "");
    setSelectedProductId(productId);
    form.unregister("quantity");
    form.register("quantity", {
      required: "Quantity is required",
      validate: (value) =>
        Number(value) <= available || "Cannot exceed available stock",
    });
  };

  const handleSubmit = async (values: TransferFormValues) => {
    try {
      setIsLoading(true);
      if (!branchId) {
        throw new Error("Branch ID is missing. Please log in again.");
      }

      const selectedProduct = products.find(p => p.id === values.product);
      const available = productQtyMap[values.product] ?? 0;

      if (Number(values.quantity) > available) {
        form.setError("quantity", {
          type: "manual",
          message: `Max ${available.toFixed(2)} allowed`,
        });
        setIsLoading(false);
        return;
      }

      // Insert into outgoing transfer table
      const { error: outError } = await supabase
        .from("product_transfers_out")
        .insert([
          {
            product_id: values.product,
            branch_id: branchId,
            // to_branch_id: values.toBranch,
            quantity: Number(values.quantity),
            notes: values.notes,
            status: "pending",
          },
        ]);
      if (outError) throw outError;

      // Insert into incoming transfer table
      const { error: inError } = await supabase
        .from("product_transfers_in")
        .insert([
          {
            product_id: values.product,
            branch_id: values.toBranch,
            // from_branch_id: branchId,
            quantity: Number(values.quantity),
            notes: values.notes,
            status: "pending",
          },
        ]);
      if (inError) throw inError;

      // Create notifications
      const receivingBranchName = branches.find(b => b.id === values.toBranch)?.name || "Unknown Branch";
      const notifications = [
        {
          branch_id: values.toBranch,
          title: "Incoming Product Transfer",
          message: `${selectedProduct?.name} (${values.quantity}) is being transferred to your branch from ${userBranch?.name}`,
        },
        {
          branch_id: branchId,
          title: "Outgoing Product Transfer",
          message: `${selectedProduct?.name} (${values.quantity}) is being transferred to ${receivingBranchName}`,
        },
      ];

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert(notifications);
      if (notificationError) throw notificationError;

      toast({
        title: "Transfer Initiated",
        description: "Product transfer has been initiated successfully.",
      });

      // Invalidate queries
      queryClient.invalidateQueries({ 
        queryKey: ["branch_product_today_view", branchId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["branch_product_today_view", values.toBranch] 
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Transfer failed:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to record transfer",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProduct = form.watch("product");
  const quantity = form.watch("quantity");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Product</DialogTitle>
        </DialogHeader>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Product Selection */}
            <FormField
              control={form.control}
              name="product"
              render={({ field }) => (
                <FormItem>
                  <FormLabel withAsterisk>Product</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(e) => {
                        handleProductChange(e);
                        field.onChange(e);
                      }}
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => {
                          const available = productQtyMap[product.id] ?? 0;
                          const disabled = available <= 0;
                          return (
                            <SelectItem
                              key={product.id}
                              value={product.id}
                              disabled={disabled}
                            >
                              {product.name} ({available.toFixed(2)} in stock)
                              {disabled && (
                                <span className="text-red-500 ml-2">(Out of stock)</span>
                              )}
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

            {/* Destination Branch */}
            <FormField
              control={form.control}
              name="toBranch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel withAsterisk>To Branch</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination branch" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {branches
                        .filter((b) => b.id !== branchId)
                        .map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quantity */}
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
                              message: `Not Allowed! Stock = ${available.toFixed(2)}`,
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

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isLoading ||
                  !selectedProduct ||
                  !quantity ||
                  Number(quantity) <= 0 ||
                  Number(quantity) > (selectedProduct ? productQtyMap[selectedProduct] : 0)
                }
              >
                {isLoading ? (
                  <div className="flex items-center">
                    Transferring...
                    <div className="ml-2 animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  </div>
                ) : (
                  "Transfer Product"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};