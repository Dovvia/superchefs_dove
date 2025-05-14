import { RefetchOptions, QueryObserverResult } from "@tanstack/react-query";
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

  const handleSubmit = async (values: {
    material: string;
    quantity: string;
    reason: string;
    branch: string;
    user: string;
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
      const { error } = await supabase.from("damaged_materials").insert([
        {
          material_id: values?.material,
          branch_id: values?.branch,
          user_id: values?.user,
          quantity: Number(values?.quantity),
          reason: values?.reason,
        },
      ]);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Material damage recorded successfully",
      });
      await refetch();
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
