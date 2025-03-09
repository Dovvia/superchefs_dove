import { RefetchOptions, QueryObserverResult } from "@tanstack/react-query";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MaterialRequestForm from "@/components/material_request/MaterialRequestForm";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MaterialRequest } from "@/types/material_request";
interface MaterialRequestDialogProps {
  onOpenChange: (open: boolean) => void;
  refetch: (
    options?: RefetchOptions
  ) => Promise<QueryObserverResult<MaterialRequest[], Error>>;
}

export const MaterialRequestDialog = ({
  onOpenChange,
  refetch,
}: MaterialRequestDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (values: {
    material: string;
    quantity: string;
    status: string;
    branch: string;
    user: string;
  }) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.from("material_requests").insert([
        {
          material_id: values?.material,
          branch_id: values?.branch,
          user_id: values?.user,
          quantity: Number(values?.quantity),
          status: "pending",
        },
      ]);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Material request successfully sent",
      });
      await refetch();
      onOpenChange(false);
    } catch (error) {
      console.error("Error sending material request :", error);
      toast({
        title: "Error",
        description: "Failed to send material request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent aria-describedby="material request form">
      <DialogHeader>
        <DialogTitle>Request</DialogTitle>
      </DialogHeader>
      <MaterialRequestForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        onCancel={() => onOpenChange(false)} branchId={""} materials={[]}      />
    </DialogContent>
  );
};
