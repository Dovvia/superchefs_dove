import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import z from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/types/products";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface ProductTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  onSuccess?: (id: string, transfer: { id: string; data: string }) => void;
}

interface FormValues {
  product: string;
  fromBranch: string;
  toBranch: string;
  quantity: string;
  notes?: string;
}

const formSchema = z.object({
  product: z.string().min(1, "Please select a product"),
  fromBranch: z.string().optional(),
  toBranch: z.string().min(1, "Please select a destination branch"),
  quantity: z
    .string()
    .min(1, "Quantity is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Quantity must be greater than zero",
    }),
  notes: z.string().optional(),
});

const ProductTransferDialog = ({
  open,
  onOpenChange,
  products,
  onSuccess,
}: ProductTransferDialogProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      product: "",
      fromBranch: "",
      toBranch: "",
      quantity: "",
      notes: "",
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: branches,
    refetch,
    isLoading: isLoadingBranches,
  } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select(`*`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      // Create transfer record
      const { data: transferData, error: transferError } = await supabase
        .from("product_transfers")
        .insert([
          {
            product_id: data.product,
            from_branch_id: data.fromBranch,
            to_branch_id: data.toBranch,
            quantity: Number(data.quantity),
            notes: data.notes,
            status: "pending",
          },
        ])
        .select("product_id, id");

      if (transferError) throw transferError;

      // Create notifications for both branches
      const toBranch = branches.find((b) => b.id === data.toBranch);
      const fromBranch = branches.find((b) => b.id === data.fromBranch);
      const product = products?.find((p) => p.id === data.product);

      const notifications = [
        {
          branch_id: data.toBranch,
          title: "Incoming Product Transfer",
          message: `${product.name} (${data.quantity}) is being transferred to your branch from ${fromBranch?.name}`,
        },
        {
          branch_id: data.fromBranch,
          title: "Outgoing Product Transfer",
          message: `${product.name} (${data.quantity}) is being transferred to ${toBranch?.name}`,
        },
      ];

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (notificationError) throw notificationError;

      toast({
        title: "Transfer initiated",
        description: "The product transfer has been initiated successfully.",
      });

      queryClient.invalidateQueries({ queryKey: ["product-transfers"] });
      onSuccess?.("transfer", {
        id: transferData[0]?.product_id,
        data: transferData[0]?.id,
      });
      onOpenChange(false);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: (error as { message: string }).message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Product</DialogTitle>
          <DialogDescription>
            Transfer product to another branch
          </DialogDescription>
        </DialogHeader>

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
                        form.setValue("fromBranch", product?.branch_id);
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
                            disabled={!!product?.transfer_id}
                          >
                            {product.name} - ${product.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* <div className="space-y-2"> */}
            <FormField
              control={form.control}
              name="toBranch"
              render={({ field }) => (
                <FormItem ref={field.ref}>
                  <FormLabel htmlFor="toBranch" withAsterisk>
                    To Branch
                  </FormLabel>
                  <FormControl id="toBranch">
                    <Select
                      {...field}
                      onValueChange={(e) => {
                        const br = branches?.find((br) => br?.id === e);
                        form.setValue("toBranch", br?.id);
                        field.onChange(e);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches
                          // ?.filter((branch) => branch.id !== fromBranchId)
                          ?.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id}>
                              {branch.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* </div> */}

            {/* <div className="space-y-2"> */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem ref={field.ref}>
                  <FormLabel htmlFor="quantity" withAsterisk>
                    {/* Quantity ({product?.transferOut}) */}
                    Quantity
                  </FormLabel>
                  <FormControl id="quantity">
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="Quantity to transfer"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* </div> */}

            {/* <div className="space-y-2"> */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem ref={field.ref}>
                  <FormLabel htmlFor="notes">Notes</FormLabel>
                  <FormControl id="notes">
                    <Textarea
                      id="notes"
                      placeholder="Add any additional notes..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* </div> */}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                Initiate Transfer
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductTransferDialog;
