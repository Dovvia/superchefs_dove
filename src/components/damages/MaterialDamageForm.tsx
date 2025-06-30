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
import { useEffect } from "react"; // Import useEffect

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

  // Fetch the branch_id of the current user
  useEffect(() => {
    const fetchUserBranch = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from("profiles")
          .select("branch_id")
          .eq("user_id", user.id)
          .single();

        if (!error && data?.branch_id) {
          form.setValue("branch", data.branch_id); // Set the user's branch_id in the form
        } else {
          console.error("Failed to fetch branch_id:", error);
        }
      }
    };

    fetchUserBranch();
  }, [user, form]);

  const { data: materials } = useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("materials").select(`*`);

      if (error) throw error;
      return data;
    },
  });

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
                    field.onChange(e); // Only update the material field
                    form.setValue("user", user?.id); // Set the user ID
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
            {isLoading ? <div className="flex justify-center items-center">Adding...
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2  border-white"></div>
    </div> : "Add Damaged Material"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default MaterialDamageForm;
