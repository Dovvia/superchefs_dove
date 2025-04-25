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
import { Progress } from "@/components/ui/progress";
import { UserPlus, Edit2, UserCog, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type UserWithDetails = {
  id: string;

  email: string;
  created_at: string;
  profile: {
    first_name: string;
    last_name: string;
    branch_id?: string;
    user_id: string;
    email: string;
    password: string;
    education: string | null;
    phone: number | null;
    address: string | null;
    salary: number | null;
    nin: number | null;
    employment_date: string | null;
    role: string;
  };
  // user_roles: {
  //   role: string;
  //   branch_id?: string;
  // }[];
};

const UserManagement = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creationLoading, setCreationLoading] = useState(false);
  const [createUser, setCreateUser] = useState(true);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isAssignBranchModalOpen, setIsAssignBranchModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(
    null
  );
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: 234,
    address: "",
    salary: 1000,
    nin: 123,
    employment_date: new Date().toISOString().split("T")[0], // Set default to today's date
    education: "primary" as
      | "primary"
      | "secondary"
      | "nce"
      | "nd"
      | "hnd"
      | "bachelor"
      | "master"
      | "phd"
      | "professor",
    role: "staff" as
      | "staff"
      | "baker"
      | "cleaner"
      | "sales_rep"
      | "cook"
      | "manager"
      | "procurement"
      | "accountant"
      | "maintenance"
      | "quality_control"
      | "supplier"
      | "head_office_supplier"
      | "area_manager"
      | "admin",
    branchId: "",
  });

  // New state for filters
  const [searchName, setSearchName] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterBranch, setFilterBranch] = useState("");

  const { toast } = useToast(); // Initialize useToast

  // Add this at the top of your component
  const queryClient = useQueryClient();

  // Define the refetchUsers function
  const refetchUsers = async () => {
    await queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  // Fetch users - Direct database query instead of admin.listUsers which requires service_role key
  const {
    data: users,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      console.log("Fetching users from profiles table");

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }

      // const { data: roles, error: rolesError } = await supabase
      //   .from("user_roles")
      //   .select("*");

      // if (rolesError) {
      //   console.error("Error fetching user roles:", rolesError);
      //   throw rolesError;
      // }

      return profiles.map((profile) => ({
        id: profile.id,
        email: profile.email || "Unknown email",
        created_at: profile.created_at,
        profile: {
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
          email: profile.email || "N/A",
          password: profile.password || "N/A",
          branch_id: profile.branch_id,
          user_id: profile.user_id || "N/A",
          phone: profile.phone || 234,
          address: profile.address || null,
          salary: profile.salary || 0,
          nin: profile.nin || 123,
          employment_date: profile.employment_date || null,
          education: profile.education || null,
          role: profile.role || "N/A",
        },
        // user_roles: roles?.filter((r) => r.profile_id === profile.id) || [],
      }));
    },
  });

  const {
    data: branches,
    isLoading: isLoadingBranches,
    error: branchesError,
  } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data, error } = await supabase.from("branches").select("*");

      if (error) {
        console.error("Error fetching branches:", error);
        throw error;
      }

      return data;
    },
  });

  // Log errors
  if (usersError) {
    console.error("Error fetching users:", usersError);
  }
  if (branchesError) {
    console.error("Error fetching branches:", branchesError);
  }

  // Ensure users and branches are defined before filtering
  const filteredUsers = users
    ? users.filter((user) => {
        const matchesName =
          `${user.profile?.first_name} ${user.profile?.last_name}`
            .toLowerCase()
            .includes(searchName.toLowerCase());
        const matchesRole: boolean =
          filterRole === "all" || filterRole === ""
            ? true
            : user.profile.role.some(
                (role: { role: string }) => role.role === filterRole
              );
        const matchesBranch =
          filterBranch === "all" || filterBranch === ""
            ? true
            : user.profile?.branch_id === filterBranch;

        return matchesName && matchesRole && matchesBranch;
      })
    : [];

  // Graceful fallback for loading or errors
  if (isLoadingUsers || isLoadingBranches) {
    return <div>Loading users and their details...</div>;
  }

  if (usersError || branchesError) {
    return <div>Error loading data. Please try again later.</div>;
  }

  if (!users?.length) {
    return <div>No users found.</div>;
  }

  const handleAddUserClick = () => {
    setCreationLoading(false); // Set loading state to true
    setIsCreateModalOpen(true); // Open the modal
  };

  const handleDialogClose = () => {
    setIsCreateModalOpen(false); // Close the modal
    setCreationLoading(false); // Reset loading state
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creationLoading) return;
    // Prevent multiple submissions

    setCreationLoading(true);
    // Set loading state to true

    try {
      // Validate input

      if (!newUser.email || !newUser.password) {
        toast({
          title: "Error",
          description: "Email and password are required.",
          variant: "destructive",
        });
        return;
      }
      if (!/\S+@\S+\.\S+/.test(newUser.email)) {
        toast({
          title: "Error",
          description: "Invalid email format.",
          variant: "destructive",
        });
        return;
      }
      if (newUser.password.length < 6) {
        toast({
          title: "Error",
          description: "Password must be at least 6 characters long.",
          variant: "destructive",
        });
        return;
      }

      // Step 1: Sign up the user

      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: newUser.email,
          password: newUser.password,
          options: {
            data: {
              first_name: newUser.firstName,
              last_name: newUser.lastName,
            },
          },
        });
      if (signUpError) {
        console.error("Error signing up user:", signUpError);
        throw new Error(signUpError.message);
      }

      // Optionally, insert additional profile data into the profiles table

      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: signUpData.user.id,
        email: newUser.email,
        first_name: newUser.firstName,
        last_name: newUser.lastName,
        branch_id: newUser.branchId || null,
        phone: newUser.phone || null,
        address: newUser.address || null,
        salary: newUser.salary || 0,
        nin: newUser.nin || 123,
        employment_date: newUser.employment_date || null,
        education: newUser.education || null,
        role: newUser.role || "staff",
      });
      if (profileError) {
        console.error("Error inserting profile data:", profileError);
        throw new Error(profileError.message);
      }

      // Success

      toast({
        title: "Success",
        description: "User created successfully.",
        variant: "default",
      });

      // Close the dialog and reset the form

      setIsCreateModalOpen(false);
      setNewUser({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        phone: 234,
        address: "",
        salary: 0,
        nin: 123,
        employment_date: new Date().toISOString().split("T")[0],
        education: "primary",
        role: "staff",
        branchId: "",
      });

      // Refetch the users list to reflect the new user in the table
      await refetchUsers();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setCreationLoading(false);
    }
  };
  //   }; catch (error: any) {
  //     console.error("Error creating user:", error);
  //     toast({
  //       title: "Error",
  //       description: error.message,
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setCreationLoading(false);
  //   }
  // };

  const handleUpdateRole = async (
    role:
      | "staff"
      | "baker"
      | "cleaner"
      | "sales_rep"
      | "cook"
      | "manager"
      | "procurement"
      | "accountant"
      | "maintenance"
      | "quality_control"
      | "supplier"
      | "head_office_supplier"
      | "area_manager"
      | "admin"
  ) => {
    if (selectedUser) {
      try {
        // Update profile role
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ role })
          .eq("user_id", selectedUser.id);

        if (profileError) throw profileError;

        toast({
          title: "Success",
          description: "User role updated successfully.",
          variant: "default",
        });

        setIsRoleModalOpen(false);
        setSelectedUser(null);
      } catch (error: any) {
        toast({
          title: "Error",
          description: `Error updating role: ${error.message}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleUpdateBranch = async (branchId: string) => {
    if (selectedUser) {
      try {
        // Update profile branch_id using user_id
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ branch_id: branchId })
          .eq("user_id", selectedUser.id);

        if (profileError) throw profileError;

        toast({
          title: "Success",
          description: "User branch updated successfully.",
          variant: "default",
        });

        setIsAssignBranchModalOpen(false);
        setSelectedUser(null);
      } catch (error: any) {
        toast({
          title: "Error",
          description: `Error updating branch: ${error.message}`,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div>
      <div className="space-y-6">
        {/* Filter Section */}
        <div className="flex flex-wrap gap-4 items-center">
          <Input
            placeholder="Search by name"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="w-60 sm:w-1/3"
          />
          <Select
            value={filterRole}
            onValueChange={(value) => setFilterRole(value)}
          >
            <SelectTrigger className="w-1/2 sm:w-1/3 border rounded-md p-2">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent className="bg-white border rounded-md shadow-md">
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="baker">Baker</SelectItem>
              <SelectItem value="cleaner">Cleaner</SelectItem>
              <SelectItem value="sales_rep">Sales-Rep</SelectItem>
              <SelectItem value="cook">Cook</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="procurement">Procurement</SelectItem>
              <SelectItem value="accountant">Accountant</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="quality_control">Quality Control</SelectItem>
              <SelectItem value="supplier">Supplier</SelectItem>
              <SelectItem value="head_office_supplier">
                Head Office Supplier
              </SelectItem>
              <SelectItem value="area_manager">Area Manager</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filterBranch}
            onValueChange={(value) => setFilterBranch(value)}
          >
            <SelectTrigger className="w-1/2 sm:w-1/3 border rounded-md p-2">
              <SelectValue placeholder="Filter by branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches?.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Users</h2>
          <Button
            className="flex items-center gap-2"
            onClick={handleAddUserClick}
          >
            <UserPlus className="h-4 w-4" />
            <span>Add User</span>
          </Button>
        </div>

        {/* Add User Dialog */}
        <Dialog open={isCreateModalOpen} onOpenChange={handleDialogClose}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system with their details and role/access
                level.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={handleCreateUser}
              className="space-y-4 overflow-auto max-h-[80vh] p-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={newUser.firstName}
                    onChange={(e) =>
                      setNewUser({ ...newUser, firstName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={newUser.lastName}
                    onChange={(e) =>
                      setNewUser({ ...newUser, lastName: e.target.value })
                    }
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
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={newUser.address}
                  onChange={(e) =>
                    setNewUser({ ...newUser, address: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newUser.phone}
                  onChange={(e) =>
                    setNewUser({ ...newUser, phone: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="education">Education</Label>
                <Select
                  value={newUser.education}
                  onValueChange={(value) =>
                    setNewUser({
                      ...newUser,
                      education: value as
                        | "primary"
                        | "secondary"
                        | "nce"
                        | "nd"
                        | "hnd"
                        | "bachelor"
                        | "master"
                        | "phd"
                        | "professor",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select education level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="secondary">Secondary</SelectItem>
                    <SelectItem value="nce">NCE</SelectItem>
                    <SelectItem value="nd">ND</SelectItem>
                    <SelectItem value="hnd">HND</SelectItem>
                    <SelectItem value="bachelor">Bachelor</SelectItem>
                    <SelectItem value="master">Master</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                    <SelectItem value="professor">Professor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nin">NIN</Label>
                <Input
                  id="nin"
                  value={newUser.nin}
                  onChange={(e) =>
                    setNewUser({ ...newUser, nin: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employment_date">Employment Date</Label>
                <Input
                  id="employment_date"
                  type="date"
                  value={newUser.employment_date}
                  onChange={(e) =>
                    setNewUser({ ...newUser, employment_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  value={newUser.salary}
                  onChange={(e) =>
                    setNewUser({ ...newUser, salary: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) =>
                    setNewUser({
                      ...newUser,
                      role: value as
                        | "staff"
                        | "baker"
                        | "cleaner"
                        | "sales_rep"
                        | "cook"
                        | "manager"
                        | "procurement"
                        | "accountant"
                        | "maintenance"
                        | "quality_control"
                        | "supplier"
                        | "head_office_supplier"
                        | "area_manager"
                        | "admin",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="baker">Baker</SelectItem>
                    <SelectItem value="cleaner">Cleaner</SelectItem>
                    <SelectItem value="sales_rep">Sales-Rep</SelectItem>
                    <SelectItem value="cook">Cook</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="procurement">Procurement</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="quality_control">
                      Quality Control
                    </SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                    <SelectItem value="head_office_supplier">
                      Head Office Supplier
                    </SelectItem>
                    <SelectItem value="area_manager">Area Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch">Branch</Label>
                <Select
                  value={newUser.branchId}
                  onValueChange={(value) =>
                    setNewUser({ ...newUser, branchId: value })
                  }
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
              <DialogFooter>
                <Button type="submit" disabled={creationLoading}>
                  {creationLoading ? <Progress className="mr-2" /> : null}
                  {creationLoading ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-center">Email</TableHead>
                <TableHead className="text-center">Roles</TableHead>
                <TableHead className="text-center">Branch</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers?.map((user) => {
                const branchId = user.profile?.branch_id;
                const branchName =
                  branches?.find((b) => b.id === branchId)?.name || "No Branch";

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      {user.profile?.first_name} {user.profile?.last_name}
                    </TableCell>
                    <TableCell className="text-center">
                      {user.profile?.email}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          {user.profile.role ? user.profile.role : "No Role"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{branchName}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog
                          open={isRoleModalOpen && selectedUser?.id === user.id}
                          onOpenChange={(open) => {
                            setIsRoleModalOpen(open);
                            if (!open) setSelectedUser(null);
                          }}
                        >
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
                                Assign a new role to {user.profile?.first_name}{" "}
                                {user.profile?.last_name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Current Roles</Label>
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="secondary">
                                    {user.profile.role
                                      ? user.profile.role
                                      : "No Role"}
                                  </Badge>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>Assign New Role</Label>
                                <div className="grid m-12 h-60 overflow-y-scroll space-y-2 space-x-2">
                                  <Button
                                    style={{ marginLeft: "8px" }}
                                    variant="outline"
                                    onClick={() => handleUpdateRole("staff")}
                                  >
                                    Staff
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => handleUpdateRole("baker")}
                                  >
                                    Baker
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => handleUpdateRole("cleaner")}
                                  >
                                    Cleaner
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() =>
                                      handleUpdateRole("sales_rep")
                                    }
                                  >
                                    Sales-Rep
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => handleUpdateRole("cook")}
                                  >
                                    Cook
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => handleUpdateRole("manager")}
                                  >
                                    Manager
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() =>
                                      handleUpdateRole("procurement")
                                    }
                                  >
                                    Procurement
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() =>
                                      handleUpdateRole("accountant")
                                    }
                                  >
                                    Accountant
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() =>
                                      handleUpdateRole("maintenance")
                                    }
                                  >
                                    Maintenance
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() =>
                                      handleUpdateRole("quality_control")
                                    }
                                  >
                                    Quality Control
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => handleUpdateRole("supplier")}
                                  >
                                    Supplier
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() =>
                                      handleUpdateRole("head_office_supplier")
                                    }
                                  >
                                    Head Office Supplier
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() =>
                                      handleUpdateRole("area_manager")
                                    }
                                  >
                                    Area Manager
                                  </Button>

                                  <Button
                                    variant="outline"
                                    onClick={() => handleUpdateRole("admin")}
                                  >
                                    Admin
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Dialog
                          open={
                            isAssignBranchModalOpen &&
                            selectedUser?.id === user.id
                          }
                          onOpenChange={(open) => {
                            setIsAssignBranchModalOpen(open);
                            if (!open) setSelectedUser(null);
                          }}
                        >
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
                                Assign {user.profile?.first_name}{" "}
                                {user.profile?.last_name} to a branch
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
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select branch" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {branches?.map((branch) => (
                                      <SelectItem
                                        key={branch.id}
                                        value={branch.id}
                                      >
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
    </div>
  );
};

export default UserManagement;
