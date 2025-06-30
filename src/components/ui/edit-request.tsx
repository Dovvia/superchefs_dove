import * as z from "zod";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type {
  MiniRequestItem,
  EditRequestFormValues,
} from "@/types/edit-request";

interface DialogProps {
  loading: boolean;
  handleEditRequest: (values: EditRequestFormValues) => Promise<void>;
  onOpenChange: (open: boolean) => void;
  items: MiniRequestItem[];
}

export const EditRequestDialog = ({
  loading,
  handleEditRequest,
  onOpenChange,
  items,
}: DialogProps) => {
  return (
    <DialogContent
      aria-describedby="edit-material-request"
      className="max-w-[50%]"
    >
      <DialogHeader>
        <DialogTitle>Edit Material Request(s)</DialogTitle>
      </DialogHeader>
      <EditRequestForm
        onSubmit={handleEditRequest}
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

export type FormValues = z.infer<typeof formSchema>;

interface EditRequestFormProps {
  onSubmit: (values: FormValues) => Promise<void>;
  isLoading: boolean;
  onCancel: () => void;
  items: MiniRequestItem[];
}

const EditRequestForm = ({
  onSubmit,
  isLoading,
  onCancel,
  items,
}: EditRequestFormProps) => {
  const form = useForm<FormValues>({
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
                        defaultValue={items[index]?.name}
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
                        defaultValue={items[index]?.unit}
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
                          defaultValue={items[index]?.quantity}
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
            {isLoading ? <div className="flex justify-center items-center">Submitting
      <div className="animate-spin rounded-full text-green-500 h-8 w-8 border-t-2 border-b-2  border-white"></div>
    </div> : "Submit"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
