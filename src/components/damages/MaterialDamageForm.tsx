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
import { useEffect, useState, useMemo } from "react"; // Import useEffect

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
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");

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

  // Fetch current quantity for selected material and branch
  const branchId = form.watch("branch");
  const { data: materialQtyData } = useQuery({
    queryKey: ["branch_material_today_view", branchId],
    enabled: !!branchId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branch_material_today_view")
        .select("*")
        .eq("branch_id", branchId);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000,
  });

  // Map material_id to current quantity
  const materialQtyMap = useMemo(() => {
    const map: Record<string, number> = {};
    (materialQtyData || []).forEach((row: any) => {
      map[row.material_id] =
        (row.total_quantity ?? 0) +
        (row.opening_stock ?? 0) +
        (row.total_procurement_quantity ?? 0) +
        (row.total_transfer_in_quantity ?? 0) -
        (row.total_transfer_out_quantity ?? 0) -
        (row.total_usage ?? 0) -
        (row.total_damage_quantity ?? 0);
    });
    return map;
  }, [materialQtyData]);

  // Get max quantity for selected material
  const maxQty = selectedMaterialId
    ? materialQtyMap[selectedMaterialId] ?? 0
    : 0;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (values) => {
          const qty = Number(values.quantity);
          if (qty > maxQty) {
            form.setError("quantity", {
              type: "manual",
              message: `Cannot record more than: (${maxQty})`,
            });
            return;
          }
          await onSubmit(values);
        })}
        className="space-y-4"
      >
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
                    field.onChange(e); // update form value
                    setSelectedMaterialId(e); // update selectedMaterialId for maxQty
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
              <FormLabel htmlFor="quantity">
                Quantity (Max: {maxQty.toFixed(2)})
              </FormLabel>
              <FormControl id="quantity">
                <Input
                  placeholder="Quantity of material damages"
                  {...field}
                  type="number"
                  min={1}
                  max={maxQty}
                  step="any"
                  disabled={!selectedMaterialId}
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
            {isLoading ? (
              <div className="flex justify-center items-center">
                Adding...
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2  border-white"></div>
              </div>
            ) : (
              "Add Damaged Material"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default MaterialDamageForm;
