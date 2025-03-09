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
}

export const ProductDamageForm = ({
  products,
  onSubmit,
  isLoading,
  onCancel,
}: ProductDamageFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: "",
      reason: "",
    },
  });

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
                    form.setValue("branch", product?.branch_id);
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
          <small className="text-xs text-gray-500">
            Note: You cannot record damages for a product that has already has
            such record.
          </small>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Recording..." : "Record Damage"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
