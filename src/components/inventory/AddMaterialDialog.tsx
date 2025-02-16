import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MaterialForm from "./MaterialForm";
import { Material } from "@/types/inventory";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface AddMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddMaterialDialog = ({ open, onOpenChange, onSuccess }: AddMaterialDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (values: Material) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.from("materials").insert([values]);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Material added successfully",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding material:", error);
      toast({
        title: "Error",
        description: "Failed to add material",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Material</DialogTitle>
        </DialogHeader>
        <MaterialForm 
          onSubmit={handleSubmit} 
          isLoading={isLoading} 
          onCancel={() => onOpenChange(false)} 
        />
      </DialogContent>
    </Dialog>
  );
};