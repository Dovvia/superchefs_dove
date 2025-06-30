import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

const formSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().min(1, "Please input an item"),
      unit: z.string().min(1, "Please input a unit"),
      unit_price: z
        .string()
        .min(1, "Unit price is required")
        .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
          message: "Unit price must be greater than zero",
        }),
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
}

const ImprestForm = ({ onSubmit, isLoading, onCancel }: ImprestFormProps) => {
  const form = useForm<ImprestFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: [{ name: "", quantity: "", unit: "", unit_price: "" }],
    },
  });

  const {
    fields,
    append: addItem,
    remove: removeItem,
  } = useFieldArray({
    control: form.control,
    name: "items",
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {fields.map((_, index) => {
          const quantity = form.watch(`items.${index}.quantity`) || 0;
          const unit_price = form.watch(`items.${index}.unit_price`) || 0;
          return (
            <div className="flex gap-2" key={index}>
              <FormItem >
                <FormControl>
                  <Input
                    placeholder="Item"
                    type="text"
                    {...form.register(`items.${index}.name`)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              <FormItem className="flex-initial">
                <FormControl>
                  <Input
                    placeholder="(kg)"
                    type="text"
                    {...form.register(`items.${index}.unit`)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              <FormItem className="flex-initial">
                <FormControl>
                  <Input
                    placeholder="₦"
                    type="number"
                    {...form.register(`items.${index}.unit_price`)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              <FormItem className="flex-initial">
                <FormControl>
                  <Input
                    placeholder="Qty"
                    type="number"
                    {...form.register(`items.${index}.quantity`)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              <FormItem className="flex-initial">
                <FormControl>
                  <Input
                    placeholder="Total"
                    type="number"
                    value={Number(quantity) * Number(unit_price)}
                    readOnly
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              <Button
                size="sm"
                style={{ position: "relative", top: "8px", right: "30px", width: "20px", height: "20px", backgroundColor: "transparent" }}
                className="mt-0.5"
                onClick={() => removeItem(index)}
              >
                <Trash2 className="h-2 w-2 text-destructive" />
              </Button>
            </div>
          );
        })}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            addItem({ name: "", quantity: "", unit: "", unit_price: "" })
          }
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <div className="flex justify-center items-center">Sending... 
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2  border-white"></div>
    </div> : "Send imprest"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ImprestForm;
