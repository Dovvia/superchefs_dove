import { useState } from "react";
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
import { useAuth } from "@/hooks/auth";
import { Unit } from "../ui/unit";
import { Plus, Trash2 } from "lucide-react";
import { Material } from "@/types/inventory";

const formSchema = z.object({
  material: z.string().min(1, "Please select a material"),
  status: z.string().optional(),
  quantity: z
    .string()
    .min(1, "Quantity is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Quantity must be greater than zero",
    }),
  branch: z.string().optional(),
  user: z.string().optional(),
  items: z
    .array(
      z.object({
        material_id: z.string().min(1, "Please select a material"),
        quantity: z.number().min(1, "Quantity must be greater than zero"),
        unit_price: z.number().min(0, "Unit price must be zero or greater"),
        branch: z.string().optional(),
        user: z.string().optional(),
      })
    )
    .optional(),
});

export type MaterialRequestFormValues = z.infer<typeof formSchema>;

interface MaterialRequestFormProps {
  onSubmit: (values: MaterialRequestFormValues) => Promise<void>;
  isLoading: boolean;
  onCancel: () => void;
  branchId: string;
  materials: Material[];
}

const MaterialRequestForm = ({
  onSubmit,
  isLoading,
  onCancel,
}: MaterialRequestFormProps) => {
  const form = useForm<MaterialRequestFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      material: "",
      quantity: "",
      status: "",
      branch: "",
      user: "",
    },
  });

  const { user } = useAuth();
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

  const [items, setItems] = useState([
    { material_id: "", quantity: 1, unit_price: 0 },
  ]);

  const addItem = () => {
    setItems([...items, { material_id: "", quantity: 1, unit_price: 0 }]);
    form.setValue("items", [
      ...items,
      { material_id: "", quantity: 1, unit_price: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    form.setValue("items", newItems);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="justify-between items-center space-y-2">
          <div className="flex justify-between items-center">
          <FormField
            control={form.control}
            name="material"
            render={({ field }) => (
              <FormItem ref={field.ref} className="w-1/2">
                <FormLabel htmlFor="material">Material</FormLabel>
                <FormControl id="material">
                  <Select
                    {...field}
                    onValueChange={(e) => {
                      const mat = materials?.find((mat) => mat?.id === e);
                      form.setValue("branch", mat?.branch_id); // Set branch ID dynamically
                      form.setValue("user", user?.id);
                      field.onChange(e);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select material name" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials
                        // ?.filter((mat) => mat.id !== material?.id)
                        ?.map((mat) => (
                          <SelectItem key={mat.id} value={mat.id}>
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
            name="quantity"
            render={({ field }) => (
              <FormItem ref={field.ref} className="w-1/4" style={{transform: 'translateX(-72px)'}}>
                <FormLabel htmlFor="quantity">Quantity</FormLabel>
                <FormControl id="quantity">
                  <Input placeholder="Quantity" {...field} type="number" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          </div>

          {items.map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <FormField
                control={form.control}
                name={`items.${index}.material_id`}
                render={({ field }) => (
                  <FormItem ref={field.ref} className="w-1/2">
                    <FormControl id={`material-${index}`}>
                      <Select
                        {...field}
                        onValueChange={(e) => {
                          const mat = materials?.find((mat) => mat?.id === e);
                          form.setValue(
                            `items.${index}.branch`,
                            mat?.branch_id
                          );
                          form.setValue(`items.${index}.user`, user?.id);
                          field.onChange(e);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select material name" />
                        </SelectTrigger>
                        <SelectContent>
                          {materials?.map((mat) => (
                            <SelectItem key={mat.id} value={mat.id}>
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
                    <FormControl id={`quantity-${index}`}>
                      <Input placeholder="Quantity" {...field} type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeItem(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
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
