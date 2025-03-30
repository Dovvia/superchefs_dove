import { RefetchOptions, QueryObserverResult } from "@tanstack/react-query";
import { useState } from "react";
import * as z from "zod";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserBranch } from "@/hooks/user-branch";
import { useAuth } from "@/hooks/auth";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { ImprestOrder, ImprestOrderItem } from "@/types/imprest";

interface DialogProps {
  onOpenChange: (open: boolean) => void;
  refetch: (
    options?: RefetchOptions
  ) => Promise<QueryObserverResult<ImprestOrder[], Error>>;
  items: ImprestOrderItem[];
  resetCheck: () => void;
}

interface FormValues {
  items: ImprestOrderItem[];
}

export const FinalizeImprestOrderDialog = ({
  onOpenChange,
  items,
  refetch,
  resetCheck,
}: DialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const {
    data: { id: userBranchId },
  } = useUserBranch();
  const { user } = useAuth();

  const handleSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      const new_items = values?.items?.map((x) => ({
        branch_id: userBranchId,
        name: x?.imprest?.name,
        quantity: Number(x?.imprest?.quantity),
        status: "supplied" as ImprestOrder["status"],
        unit: x?.imprest?.unit,
        material_order_id: x?.id,
        user_id: user?.id,
      }));

      // insert new items into procurement_supplied
      const { error } = await supabase
        .from("procurement_supplied")
        .insert(new_items);
      if (error) throw error;

      // Get all order IDs that need to be updated
      const orderIds = new_items.map((item) => item.material_order_id);

      // Batch update procurement_orders in a single query
      const { error: updateError } = await supabase
        .from("procurement_orders")
        .update({ status: "supplied" }) // Set new status
        .in("id", orderIds); // Filter all relevant order IDs

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: `You have successfully recorded ${
          items?.length > 1 ? "orders" : "order"
        } as supplied`,
      });
      await refetch();
      onOpenChange(false);
      resetCheck();
    } catch (error) {
      console.error(
        `Error recording ${items?.length > 1 ? "orders" : "order"} supplied:`,
        error
      );
      toast({
        title: "Error",
        description: `Failed to record ${
          items?.length > 1 ? "orders" : "order"
        } supplied`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent aria-describedby="procurement order" className="max-w-[50%]">
      <DialogHeader>
        <DialogTitle>Record Order as Supplied</DialogTitle>
      </DialogHeader>
      <FinalizeOrderForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        onCancel={() => onOpenChange(false)}
        items={items}
      />
    </DialogContent>
  );
};

const formSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().min(1, "Please input an item"),
      unit: z.string().min(1, "Please input a unit"),
      quantity: z
        .string()
        .min(1, "Quantity is required")
        .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
          message: "Quantity must be greater than zero",
        }),
    })
  ),
});

export type ImprestFormValues = z.infer<typeof formSchema>;

interface ImprestFormProps {
  onSubmit: (values: ImprestFormValues) => Promise<void>;
  isLoading: boolean;
  onCancel: () => void;
  items: ImprestOrderItem[];
}

const FinalizeOrderForm = ({
  onSubmit,
  isLoading,
  onCancel,
  items,
}: ImprestFormProps) => {
  const form = useForm<ImprestFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items,
    },
    mode: "onSubmit",
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "items",
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {fields.map((_, index) => {
          return (
            <div className="flex grid-cols-2 gap-4" key={index}>
              <FormField
                control={form.control}
                name={`items.${index}.name`}
                render={({ field }) => (
                  <FormItem className="flex-auto w-[60%]">
                    <FormControl>
                      <Input
                        defaultValue={items[index]?.imprest?.name}
                        placeholder="Item"
                        type="text"
                        readOnly
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`items.${index}.unit`}
                render={({ field }) => (
                  <FormItem className="flex-initial">
                    <FormControl>
                      <Input
                        defaultValue={items[index]?.imprest?.unit}
                        placeholder="Unit (kg)"
                        type="text"
                        readOnly
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`items.${index}.quantity`}
                render={({ field }) => {
                  const { value, ...rest } = field;
                  return (
                    <FormItem className="flex-initial">
                      <FormControl>
                        <Input
                          defaultValue={items[index]?.imprest?.quantity}
                          placeholder="Qty"
                          type="number"
                          {...rest}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>
          );
        })}

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send supplied order"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
