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
import { Textarea } from "@/components/ui/textarea";
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

const formSchema = z.object({
  material: z.string().min(1, "Please select a material"),
  reason: z.string().optional(),
  quantity: z
    .string()
    .min(1, "Quantity is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Quantity must be greater than zero",
    }),
  branch: z.string().optional(),
  user: z.string().optional(),
});

export type DamageFormValues = z.infer<typeof formSchema>;

interface DamageFormProps {
  onSubmit: (values: DamageFormValues) => Promise<void>;
  isLoading: boolean;
  onCancel: () => void;
}

const MaterialDamageForm = ({
  onSubmit,
  isLoading,
  onCancel,
}: DamageFormProps) => {
  const form = useForm<DamageFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      material: "",
      quantity: "",
      reason: "",
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

  console.log("materials: ", materials);
  console.log("user: ", user);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="material"
          render={({ field }) => (
            <FormItem ref={field.ref}>
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
            <FormItem ref={field.ref}>
              <FormLabel htmlFor="quantity">Quantity</FormLabel>
              <FormControl id="quantity">
                <Input
                  placeholder="Quantity of material damages"
                  {...field}
                  type="number"
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
            <FormItem ref={field.ref}>
              <FormLabel htmlFor="reason">Reason</FormLabel>
              <FormControl id="reason">
                <Textarea
                  placeholder="Enter a reason for the damage..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Damaged Material"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default MaterialDamageForm;
