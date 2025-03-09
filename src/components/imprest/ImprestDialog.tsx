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
import { randomUUID } from "crypto";

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
  const getBranchId = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("branch_id")
      .eq("id", (await supabase.auth.getUser()).data?.user?.id)
      .single();

    if (error) {
      console.error("Error fetching branch ID:", error);
      return null;
    }

    return data?.branch_id;
  };
  const handleSubmit = async (values: ImprestFormValues) => {
    try {
      setIsLoading(true);
      console.log(values.items.map((item) => item.quantity));
      const branchId = values.items[0]?.branch;
      const { error } = await supabase.from("imprest").insert([{
          item: values.items.map((item) => item.item).join(", "),
          unit: values.items.map((item) => item.unit).join(", "),
          unit_price: values.items.map((item) => item.unit_price).reduce((acc, curr) => acc + curr, 0),
          branch_id: branchId,
          user_id: (await supabase.auth.getUser()).data?.user?.id,
          quantity: values.items.map((item) => item.quantity).reduce((acc, curr) => acc + curr, 0),
          status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          id: crypto.randomUUID(),
      }]);
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
    <DialogContent aria-describedby="imprest request">
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