import * as z from "zod";
import capitalize from "lodash/capitalize";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

interface MiniOrderItem {
  id: string;
  order_id: string;
  quantity: string;
  name: string;
  unit: string;
  unit_price: number;
}

interface FormValues {
  items: MiniOrderItem[];
}

interface DialogProps {
  loading: boolean;
  onSubmit: (values: FormValues) => Promise<void>;
  onOpenChange: (open: boolean) => void;
  items: MiniOrderItem[];
}

export const FinalizeOrderDialog = ({
  onOpenChange,
  items,
  loading,
  onSubmit,
}: DialogProps) => {
  return (
    <DialogContent aria-describedby="imprest order" className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Accept Imprest as received</DialogTitle>
      </DialogHeader>
      <FinalizeOrderForm
        onSubmit={onSubmit}
        isLoading={loading}
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
      order_id: z.string().optional(),
      name: z.string().min(1, "Please input an item"),
      unit: z.string().min(1, "Please input a unit"),
      quantity: z
        .string()
        .min(1, "Quantity is required")
        .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
          message: "Quantity must be greater than zero",
        }),
        unit_price: z.number().or(z.string().refine(val => !isNaN(Number(val)), {
            message: "Unit price must be a valid number",
            })).transform(val => Number(val)),
    })
  ),
});

export type OrderFormValues = z.infer<typeof formSchema>;

interface OrderFormProps {
  onSubmit: (values: OrderFormValues) => Promise<void>;
  isLoading: boolean;
  onCancel: () => void;
  items: MiniOrderItem[];
}

const FinalizeOrderForm = ({
  onSubmit,
  isLoading,
  onCancel,
  items,
}: OrderFormProps) => {
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items,
    },
  });
  const { fields } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const mutate = (data: OrderFormValues) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(mutate)} className="space-y-4">
        <ul className="list-disc list-inside">
          {fields.map((_, index) => {
            return (
              <li className="" key={index}>
                {capitalize(items[index]?.name)} -{" "}
                {`${items[index]?.quantity} (${items[index]?.unit})`}
              </li>
            );
          })}
        </ul>
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> This action will add the total cost to your operational budget. Please ensure that the details are correct.
          <br />
        </p>
        <p>
          <em>{`Accept ${
            items?.length > 1 ? "these" : "this"
          } order as received`}</em>
        </p>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <div className="flex justify-center items-center">Sending
      <div className="animate-spin rounded-full text-green-500 h-8 w-8 border-t-2 border-b-2  border-white"></div>
    </div> : "Proceed"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
