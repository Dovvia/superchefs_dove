import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Users as UsersIcon } from "lucide-react";
import AddUserDialog from "@/components/users/AddUserDialog";
import { toast } from "sonner";
import { Profile } from "@/types/users";

const Users = () => {
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      // First fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) {
        toast.error("Error loading user profiles");
        throw profilesError;
      }

      // Then fetch user roles for all profiles
      // const { data: userRoles, error: rolesError } = await supabase
      //   .from("user_roles")
      //   .select("*");

      // if (rolesError) {
      //   toast.error("Error loading user roles");
      //   throw rolesError;
      // }

      // Fetch branches for all profiles
      const { data: branches, error: branchesError } = await supabase
        .from("branches")
        .select("*");

      if (branchesError) {
        toast.error("Error loading user branches");
        throw branchesError;
      }

      // Combine the data
      const usersWithRolesAndBranches = profiles.map((profile) => ({
        ...profile,
        // user_roles: userRoles.filter((role) => role.user_id === profile.id),
        branch: branches.find((branch) => branch.id === profile.branch_id),
      }));

      return usersWithRolesAndBranches as (Profile & { role: string; branch: any; salary: number; phone: number; email: string; address: string; nin: number; employment_date: string; education: any; })[];
    },
  });
  

  const filteredUsers = users?.filter((user) => {
    const matchesRole = selectedRole ? user.role === selectedRole : true;
    const matchesBranch = selectedBranch ? user.branch?.name === selectedBranch : true;
    return matchesRole && matchesBranch;
  });

  if (isLoading) {
    return <div className="p-4">Loading users...</div>;
  }

  return (
    <div className="space-y-6 p-3 bg-white rounded-lg shadow-md w-full mx-auto margin-100">
      {/* <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Users</h2>
        <Button onClick={() => setIsAddUserOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div> */}

      <div className="flex space-x-4">
        <select
          value={selectedRole || ""}
          onChange={(e) => setSelectedRole(e.target.value || null)}
          className="border p-2 rounded"
        >
          <option value="">All Roles</option>
          {Array.from(new Set(users?.map((user) => user.role))).map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>

        <select
          value={selectedBranch || ""}
          onChange={(e) => setSelectedBranch(e.target.value || null)}
          className="border p-2 rounded"
        >
          <option value="">All Branches</option>
          {Array.from(new Set(users?.map((user) => user.branch?.name))).map((branch) => (
            <option key={branch} value={branch}>
              {branch}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers?.map((user) => (
          <Card key={user.id}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm justify-center font-medium">
            {user.first_name} {user.last_name}
          </CardTitle>
          <UsersIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          <details>
            <summary className="w-1/2 cursor-pointer hover:text-green-700">
              <strong>Details</strong>
            </summary>
            <div className="mt-2 space-y-2">
              <div>
          <strong>Role:</strong>{" "}
          {user.user_roles?.map((role, index) => (
            <span key={index}>{role.role}</span>
          ))}
              </div>
              <div>
          <strong>Branch:</strong>{" "}
          {user.branch && (
            <Badge variant={user.branch.name === "HEAD OFFICE" ? "default" : "secondary"}>
              {user.branch.name}
            </Badge>
          )}
              </div>
              <div>
          <strong>Salary:</strong> {user.salary || "N/A"}
              </div>
              <div>
          <strong>Email:</strong> {user.email || "N/A"}
              </div>
              <div>
          <strong>Phone:</strong> {user.phone || "N/A"}
              </div>
              <div>
          <strong>Address:</strong> {user.address || "N/A"}
              </div>
              <div>
          <strong>NIN:</strong> {user.nin || "N/A"}
              </div>
              <div>
          <strong>Employment Date:</strong> {user.employment_date || "N/A"}
              </div>
              <div>
          <strong>Education:</strong> {user.education || "N/A"}
              </div>
            </div>
          </details>
        </CardContent>
          </Card>
        ))}
      </div>

      {/* <AddUserDialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen} /> */}
    </div>
  );
};

export default Users;