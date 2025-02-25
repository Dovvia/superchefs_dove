import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Damage } from "@/types/damages";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MaterialDamageDialog } from "@/components/damages/MaterialDamageDialog";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

const Damages = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [userAndBranch, setUserAndBranch] = useState({
    user: null,
    branch: null,
  });
  const { toast } = useToast();

  //   const { data: products } = useQuery({
  //     queryKey: ["products"],
  //     queryFn: async () => {
  //       const { data, error } = await supabase
  //         .from("products")
  //         .select("*")
  //         .eq("is_active", true)
  //         .order("name");

  //       if (error) throw error;
  //       return data as Product[];
  //     },
  //   });

  const { data: damages, refetch: refetchDamages } = useQuery({
    queryKey: ["damaged_materials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("damaged_materials")
        .select(
          `
          *
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Damage[];
    },
  });

  const getUserAndBranch = async (user_id: string, branch_id: string) => {
    try {
      if (!user_id || !branch_id)
        throw new Error("Please enter both user id and branch id");
      // Fetch user
      const { data: user, error: userError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user_id) // Filter by user_id
        .single(); // Ensures only one result is returned;

      if (userError) throw userError;

      // Fetch branch
      const { data: branch, error: branchError } = await supabase
        .from("branches")
        .select("*")
        .eq("id", branch_id) // Filter by branch_id
        .single(); // Ensures only one result is returned;

      if (branchError) throw branchError;

      setUserAndBranch({
        user,
        branch,
      });
    } catch (error) {
      console.error("Error getting user or branch:", error);
      toast({
        title: "Error",
        description: "Failed to fetch user or branch.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Damages</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild id="material damage">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Damages
            </Button>
          </DialogTrigger>
          <MaterialDamageDialog
            onOpenChange={setIsAddDialogOpen}
            branchId={""}
            userId={""}
          />
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Id</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Recorded By</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead className="text-right">Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {damages?.map((damage) => (
              <TableRow key={damage.id}>
                <TableCell>
                  {format(new Date(damage.created_at), "MMM d, yyyy h:mm a")}
                </TableCell>
                <TableCell>{userAndBranch?.branch?.name ?? "N / A"}</TableCell>
                <TableCell className="capitalize">
                  {userAndBranch?.user?.user_id ?? "N / A"}
                </TableCell>
                <TableCell>{damage.quantity}</TableCell>
                <TableCell className="text-right">${damage.reason}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Damages;
