import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Edit2, UserCog, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";

type UserWithDetails = {
  id: string;
  email: string;
  created_at: string;
  profile: {
    first_name: string;
    last_name: string;
    branch_id?: string;
  };
  user_roles: {
    role: string;
    branch_id?: string;
  }[];
};

const UserManagement = () => {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isAssignBranchModalOpen, setIsAssignBranchModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "staff" as "admin" | "staff",
    branchId: "",
  });

  // Fetch users with their profiles and roles
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) {
        console.error("Error fetching users:", authError);
        throw authError;
      }

      const userIds = authUsers.users.map(user => user.id);
      
      // Get profiles for these users
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);
      
      // Get roles for these users
      const { data: roles } = await supabase
        .from("user_roles")
        .select("*")
        .in("user_id", userIds);

      // Combine the data
      return authUsers.users.map(user => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        profile: profiles?.find(p => p.id === user.id) || {
          first_name: "",
          last_name: ""
        },
        user_roles: roles?.filter(r => r.user_id === user.id) || []
      })) as UserWithDetails[];
    }
  });

  // Fetch branches for dropdown
  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("*");
      
      if (error) {
        throw error;
      }
      
      return data;
    }
  });

  // Create new user
  const createUserMutation = useMutation({
    mutationFn: async ({ email, password, firstName, lastName, role, branchId }: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      role: "admin" | "staff";
      branchId: string;
    }) => {
      // Create user in auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          branch_id: branchId
        }
      });
      
      if (authError) throw authError;
      
      // Ensure profile is created
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          branch_id: branchId || null
        });
      
      if (profileError) throw profileError;
      
      // Add user role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: authData.user.id,
          role,
          branch_id: branchId || null
        });
      
      if (roleError) throw roleError;
      
      return authData.user;
    },
    onSuccess: () => {
      setIsCreateModalOpen(false);
      setNewUser({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        role: "staff",
        branchId: "",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User created successfully");
    },
    onError: (error) => {
      toast.error(`Error creating user: ${error.message}`);
    }
  });

  // Update user role
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role, branchId }: { userId: string; role: "admin" | "staff"; branchId?: string }) => {
      // First check if the role already exists
      const { data: existingRoles } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", userId)
        .eq("role", role);
      
      // If role already exists, don't add it again
      if (existingRoles && existingRoles.length > 0) {
        return { message: "Role already assigned" };
      }
      
      // Add the new role
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role,
          branch_id: branchId
        });
      
      if (error) throw error;
      
      return { message: "Role updated successfully" };
    },
    onSuccess: () => {
      setIsRoleModalOpen(false);
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User role updated successfully");
    },
    onError: (error) => {
      toast.error(`Error updating role: ${error.message}`);
    }
  });

  // Update user branch
  const updateBranchMutation = useMutation({
    mutationFn: async ({ userId, branchId }: { userId: string; branchId: string }) => {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ branch_id: branchId })
        .eq("id", userId);
      
      if (profileError) throw profileError;
      
      // Update user roles - we update all roles to have the same branch
      const { error: roleError } = await supabase
        .from("user_roles")
        .update({ branch_id: branchId })
        .eq("user_id", userId);
      
      if (roleError) throw roleError;
      
      return { message: "Branch updated successfully" };
    },
    onSuccess: () => {
      setIsAssignBranchModalOpen(false);
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User branch updated successfully");
    },
    onError: (error) => {
      toast.error(`Error updating branch: ${error.message}`);
    }
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(newUser);
  };

  const handleUpdateRole = (role: "admin" | "staff") => {
    if (selectedUser) {
      updateRoleMutation.mutate({
        userId: selectedUser.id,
        role,
        branchId: selectedUser.profile.branch_id
      });
    }
  };

  const handleUpdateBranch = (branchId: string) => {
    if (selectedUser) {
      updateBranchMutation.mutate({
        userId: selectedUser.id,
        branchId
      });
    }
  };

  if (isLoadingUsers) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Users</h2>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span>Add User</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system with their details and access level.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) => setNewUser({ ...newUser, role: value as "admin" | "staff" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch">Branch</Label>
                <Select
                  value={newUser.branchId}
                  onValueChange={(value) => setNewUser({ ...newUser, branchId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Branch</SelectItem>
                    {branches?.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => {
              // Find branch name
              const branchId = user.profile?.branch_id;
              const branchName = branches?.find((b) => b.id === branchId)?.name || "No Branch";
              
              return (
                <TableRow key={user.id}>
                  <TableCell>
                    {user.profile?.first_name} {user.profile?.last_name}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.user_roles.map((role, index) => (
                        <Badge key={index} variant="outline">
                          {role.role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{branchName}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog open={isRoleModalOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                        setIsRoleModalOpen(open);
                        if (!open) setSelectedUser(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            <UserCog className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Update User Role</DialogTitle>
                            <DialogDescription>
                              Assign a new role to {user.profile?.first_name} {user.profile?.last_name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Current Roles</Label>
                              <div className="flex flex-wrap gap-2">
                                {user.user_roles.map((role, index) => (
                                  <Badge key={index} variant="secondary">
                                    {role.role}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Add Role</Label>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  onClick={() => handleUpdateRole("admin")}
                                  disabled={updateRoleMutation.isPending}
                                >
                                  Assign Admin
                                </Button>
                                <Button 
                                  variant="outline" 
                                  onClick={() => handleUpdateRole("staff")}
                                  disabled={updateRoleMutation.isPending}
                                >
                                  Assign Staff
                                </Button>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={isAssignBranchModalOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                        setIsAssignBranchModalOpen(open);
                        if (!open) setSelectedUser(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Building2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Assign Branch</DialogTitle>
                            <DialogDescription>
                              Assign {user.profile?.first_name} {user.profile?.last_name} to a branch
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Current Branch</Label>
                              <div>
                                <Badge variant="secondary">
                                  {branchName}
                                </Badge>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="branch">Select Branch</Label>
                              <Select
                                onValueChange={handleUpdateBranch}
                                defaultValue={branchId}
                                disabled={updateBranchMutation.isPending}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select branch" />
                                </SelectTrigger>
                                <SelectContent>
                                  {branches?.map((branch) => (
                                    <SelectItem key={branch.id} value={branch.id}>
                                      {branch.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UserManagement;
