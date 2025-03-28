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
  requests: string[];
}

interface MiniMaterialProps {
  material_id: string;
  quantity: string;
}

export const MaterialRequestDialog = ({
  onOpenChange,
  refetch,
  requests,
}: MaterialRequestDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (values: {
    branch: string;
    user: string;
    items: MiniMaterialProps[];
  }) => {
    try {
      setIsLoading(true);
      const new_items = values?.items?.map((x) => ({
        material_id: x?.material_id,
        quantity: Number(x?.quantity),
        branch_id: values?.branch,
        user_id: values?.user,
        status: "pending" as MaterialRequest["status"],
      }));
      const { error } = await supabase
        .from("material_requests")
        .insert(new_items);
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
        onCancel={() => onOpenChange(false)}
        requests={requests}
      />
    </DialogContent>
  );
};
