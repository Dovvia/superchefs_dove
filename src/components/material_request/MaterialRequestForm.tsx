import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Unit } from "../ui/unit";

const formSchema = z.object({
  items: z
    .array(
      z.object({
        material_id: z.string().min(1, "Please select a material"),
        quantity: z
          .string()
          .min(1, "Quantity is required")
          .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
            message: "Quantity must be greater than zero",
          }),
        unit_price: z.number().min(0, "Unit price must be zero or greater"),
      })
    )
    .min(1, "At least one item is required"),
});

export type MaterialRequestFormValues = z.infer<typeof formSchema>;

interface MaterialRequestFormProps {
  onSubmit: (values: MaterialRequestFormValues) => Promise<void>;
  isLoading: boolean;
  onCancel: () => void;
  requests: string[];
}

const MaterialRequestForm = ({
  onSubmit,
  isLoading,
  onCancel,
  requests,
}: MaterialRequestFormProps) => {
  const form = useForm<MaterialRequestFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: [
        { material_id: "", quantity: "", unit_price: 0 },
        { material_id: "", quantity: "", unit_price: 0 },
      ],
    },
  });

  const { data: materials } = useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("materials").select(`
          *
        `);

      if (error) throw error;
      return data;
    },
  });

  const {
    fields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control: form.control,
    name: "items",
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="justify-between items-center space-y-2">
          {fields.map((_, index) => (
            <div key={index} className="flex justify-between items-center">
              <FormField
                control={form.control}
                name={`items.${index}.material_id`}
                render={({ field }) => (
                  <FormItem ref={field.ref} className="w-1/2">
                    <FormLabel htmlFor={`items.${index}.material_id`} />
                    <FormControl id={`items.${index}.material_id`}>
                      <Select
                        {...field}
                        onValueChange={(e) => {
                          const mat = materials?.find((mat) => mat?.id === e);
                          form.setValue(`items.${index}.material_id`, mat?.id);
                          form.setValue(
                            `items.${index}.unit_price`,
                            mat?.unit_price
                          );
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select material name" />
                        </SelectTrigger>
                        <SelectContent>
                          {materials?.map((mat) => (
                            <SelectItem
                              key={mat.id}
                              value={mat.id}
                              disabled={requests?.includes(mat.id)}
                            >
                              {mat.name} <Unit unit={mat.unit} />
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
                name={`items.${index}.quantity`}
                render={({ field }) => (
                  <FormItem ref={field.ref} className="w-1/4">
                    <FormLabel htmlFor={`items.${index}.quantity`} />
                    <FormControl id={`items.${index}.quantity`}>
                      <Input
                        placeholder="Quantity"
                        {...field}
                        type="number"
                        onChange={(e) => {
                          form.setValue(
                            `items.${index}.quantity`,
                            e.target.value
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {index > 0 ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="invisible"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            appendItem({ material_id: "", quantity: "", unit_price: 0 })
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
            {isLoading ? "Requesting..." : "Send Request"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default MaterialRequestForm;
