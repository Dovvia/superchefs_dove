import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
// import { useUserBranch } from "@/hooks/user-branch";
// import { useAuth } from "@/hooks/auth";

type Branch = {
  id: number;
  name: string;
  address: string;
  manager: string;
  phone: string;
};

type BranchFormData = Omit<Branch, "id">;

const BranchForm = ({
  onSubmit,
  initialData,
  title,
  onClose,
}: {
  onSubmit: (data: BranchFormData) => void;
  initialData?: Branch;
  title: string;
  onClose: () => void;
}) => {
  const form = useForm<BranchFormData>({
    defaultValues: initialData || {
      name: "",
      address: "",
      manager: "",
      phone: "",
    },
  });

  const handleSubmit = async (data: BranchFormData) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branch Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter branch name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter branch address" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="manager"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Manager</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter manager name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter phone number" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          {initialData ? "Update Branch" : "Add Branch"}
        </Button>
      </form>
    </Form>
  );
};

const Branches = () => {
  const { data: fetchedBranches } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data: fetchedBranches, error: branchesError } = await supabase
        .from("branches")
        .select("*");

      if (branchesError) {
        toast.error("Error loading user profiles");
        throw branchesError;
      }

      return fetchedBranches || [];
    },
  });
  const queryClient = useQueryClient();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    if (fetchedBranches) {
      setBranches(
        fetchedBranches.map((branch: any) => ({
          id: branch.id,
          name: branch.name,
          address: branch.address || "",
          manager: branch.manager || "",
          phone: branch.phone || "",
        })) as Branch[]
      );
    }
  }, [fetchedBranches]);

  const handleAddBranch = async (data: BranchFormData) => {
    const { data: newBranch, error } = await supabase
      .from("branches")
      .insert([data])
      .single();

    if (error) {
      toast.error("Error adding branch");
      return;
    }

    setBranches([...branches, newBranch as Branch]);
    toast.success("Branch added successfully");
  };

  const handleEditBranch = async (data: BranchFormData) => {
    if (!selectedBranch) return;

    const { data: updatedBranch, error } = await supabase
      .from("branches")
      .update(data)
      .eq("id", selectedBranch.id.toString())
      .single();

    if (error) {
      toast.error("Error updating branch");
      return;
    }

    // Invalidate the branches query to refetch fresh data
    queryClient.invalidateQueries({ queryKey: ["branches"] });

    setSelectedBranch(null);
    toast.success("Branch updated successfully");
  };

  return (
    <div className="space-y-6 p-3 bg-white rounded-lg shadow-md w-full mx-auto margin-100">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Branches</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="flex items-center gap-2"
              onClick={() => setIsDialogOpen(true)}
            >
              <Building className="w-4 h-4" />
              Add Branch
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Branch</DialogTitle>
            </DialogHeader>
            <BranchForm
              onSubmit={handleAddBranch}
              title="Add New Branch"
              onClose={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {branches.filter(Boolean).map((branch) => (
          <Card key={branch.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-bold">{branch.name}</CardTitle>
              <Building className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                  <span className="text-sm">{branch.address}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    Manager: {branch.manager}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Phone: {branch.phone}
                  </p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Dialog
                    open={isEditDialogOpen && selectedBranch?.id === branch.id}
                    onOpenChange={(isOpen) => {
                      if (!isOpen) {
                        setSelectedBranch(null);
                      }
                      setIsEditDialogOpen(isOpen);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedBranch(branch);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Branch</DialogTitle>
                      </DialogHeader>
                      <BranchForm
                        onSubmit={handleEditBranch}
                        initialData={branch}
                        title="Edit Branch"
                        onClose={() => {
                          setSelectedBranch(null);
                          setIsEditDialogOpen(false);
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="secondary" size="sm" className="flex-1">
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{branch.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium">Address</h4>
                          <p className="text-sm text-muted-foreground">
                            {branch.address}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Manager</h4>
                          <p className="text-sm text-muted-foreground">
                            {branch.manager}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Phone</h4>
                          <p className="text-sm text-muted-foreground">
                            {branch.phone}
                          </p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Branches;
