// import { RefetchOptions, QueryObserverResult } from "@tanstack/react-query";
// import {
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import ImprestForm from "./ImprestForm";
// import { useState } from "react";
// import { supabase } from "@/integrations/supabase/client";
// import { useToast } from "@/hooks/use-toast";
// import { Imprest } from "@/types/imprest";

// interface ImprestDialogProps {
//   onOpenChange: (open: boolean) => void;
//   refetch: (
//     options?: RefetchOptions
//   ) => Promise<QueryObserverResult<Imprest[], Error>>;
// }

// export const ImprestDialog = ({
//   onOpenChange,
//   refetch,
// }: ImprestDialogProps) => {
//   const [isLoading, setIsLoading] = useState(false);
//   const { toast } = useToast();

//   const handleSubmit = async (values: ImprestFormValues) => {
//     try {
//       setIsLoading(true);
//       const { error } = await supabase.from("imprest").insert([
//         {
//           item: values.item,
//           unit: values.unit,
//           unit_price: values.unit_price,
//           branch_id: values.branch,
//           user_id: values.user,
//           quantity: Number(values.quantity),
//           status: "pending",
//           created_at: new Date().toISOString(),
//           updated_at: new Date().toISOString(),
//           id: crypto.randomUUID(),
//         },
//       ]);
//       if (error) throw error;

//       toast({
//         title: "Success",
//         description: "Imprest sent successfully",
//       });
//       await refetch();
//       onOpenChange(false);
//     } catch (error) {
//       console.error("Error sending imprest:", error);
//       toast({
//         title: "Error",
//         description: "Failed to send imprest",
//         variant: "destructive",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <DialogContent aria-describedby="imprest request">
//       <DialogHeader>
//         <DialogTitle>Send Imprest Request</DialogTitle>
//       </DialogHeader>
//       <ImprestForm
//         onSubmit={handleSubmit}
//         isLoading={isLoading}
//         onCancel={() => onOpenChange(false)}
//       />
//     </DialogContent>
//   );
// };

import { RefetchOptions, QueryObserverResult } from "@tanstack/react-query";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ImprestForm from "./ImprestForm";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ImprestFormValues } from "./ImprestForm"; // Ensure this import matches the path
import { Imprest } from "@/types/imprest"; // Ensure this import matches the path
import { useUserBranch } from "@/hooks/user-branch";
import { useAuth } from "@/hooks/auth";

interface ImprestDialogProps {
  onOpenChange: (open: boolean) => void;
  refetch: (
    options?: RefetchOptions
  ) => Promise<QueryObserverResult<Imprest[], Error>>;
}

export const ImprestDialog = ({
  onOpenChange,
  refetch,
}: ImprestDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const {
    data: { id: userBranchId },
  } = useUserBranch();
  const { user } = useAuth();
  const handleSubmit = async (values: ImprestFormValues) => {
    try {
      setIsLoading(true);
      const new_items = values?.items?.map((x) => ({
        branch_id: userBranchId,
        name: x?.name,
        quantity: Number(x?.quantity),
        status: "pending",
        unit: x?.unit,
        unit_price: Number(x?.unit_price),
        user_id: user?.id,
      }));

      const { error } = await supabase
        .from("imprest_requests")
        .insert(new_items);
      if (error) throw error;

      toast({
        title: "Success",
        description: "Imprest sent successfully",
      });
      await refetch();
      onOpenChange(false);
    } catch (error) {
      console.error("Error sending imprest:", error);
      toast({
        title: "Error",
        description: "Failed to send imprest",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent aria-describedby="imprest request" className="max-w-[50%]">
      <DialogHeader>
        <DialogTitle>Send Imprest Request</DialogTitle>
      </DialogHeader>
      <ImprestForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        onCancel={() => onOpenChange(false)}
      />
    </DialogContent>
  );
};
