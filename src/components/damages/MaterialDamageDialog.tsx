import { RefetchOptions, QueryObserverResult, useQueryClient } from "@tanstack/react-query";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MaterialDamageForm from "./MaterialDamageForm";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Damage } from "@/types/damages";
interface MaterialDamageDialogProps {
  onOpenChange: (open: boolean) => void;
  refetch: (
    options?: RefetchOptions
  ) => Promise<QueryObserverResult<Damage[], Error>>;
}

export const MaterialDamageDialog = ({
  onOpenChange,
  refetch,
}: MaterialDamageDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (values: {
    material: string;
    quantity: string;
    reason: string;
    branch: string;
    user: string;
    cost: number;
  }) => {
    if (!values.branch) {
      toast({
        title: "Error",
        description: "Branch is required to record material damage",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Fetch unit_price for the selected material
      const { data: materialData, error: materialError } = await supabase
        .from("materials")
        .select("unit_price")
        .eq("id", values.material)
        .single();

      if (materialError || !materialData) {
        throw materialError || new Error("Material not found");
      }

      const unitPrice = Number(materialData.unit_price) || 0;
      const quantity = Number(values.quantity) || 0;
      const cost = unitPrice * quantity;

      const { error } = await supabase.from("damaged_materials").insert([
        {
          material_id: values.material,
          branch_id: values.branch,
          user_id: values.user,
          quantity,
          reason: values.reason,
          cost, // Always calculated
        },
      ]);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Material damage recorded successfully",
      });
      await refetch();
      queryClient.invalidateQueries({ queryKey: ["branch_material_today_view"] });
      queryClient.invalidateQueries({ queryKey: ["damaged_materials"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Error recording material damage:", error);
      toast({
        title: "Error",
        description: "Failed to record material damage",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    } 
  };

  return (
    <DialogContent aria-describedby="material damage">
      <DialogHeader>
        <DialogTitle>Record Material Damage</DialogTitle>
      </DialogHeader>
      <MaterialDamageForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        onCancel={() => onOpenChange(false)}
      />
    </DialogContent>
  );
};
