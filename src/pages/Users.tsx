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
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) {
        toast.error("Error loading user roles");
        throw rolesError;
      }

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
        user_roles: userRoles.filter((role) => role.user_id === profile.id),
        branch: branches.find((branch) => branch.id === profile.branch_id),
      }));

      return usersWithRolesAndBranches as (Profile & { user_roles: { role: string }[]; branch: any })[];
    },
  });

  const filteredUsers = users?.filter((user) => {
    const matchesRole = selectedRole ? user.user_roles.some((role) => role.role === selectedRole) : true;
    const matchesBranch = selectedBranch ? user.branch?.name === selectedBranch : true;
    return matchesRole && matchesBranch;
  });

  if (isLoading) {
    return <div className="p-4">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Users</h2>
        <Button onClick={() => setIsAddUserOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="flex space-x-4">
        <select
          value={selectedRole || ""}
          onChange={(e) => setSelectedRole(e.target.value || null)}
          className="border p-2 rounded"
        >
          <option value="">All Roles</option>
          {Array.from(new Set(users?.flatMap((user) => user.user_roles.map((role) => role.role)))).map((role) => (
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
              <CardTitle className="text-sm font-medium">
                {user.first_name} {user.last_name}
              </CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="display:flex flex space-x-8">
              <div className="space-y-2">
                {user.user_roles?.map((role, index) => (
                  <Badge key={index} variant="outline">
                    {role.role}
                  </Badge>
                ))}
              </div>
              <div className="space-y-2">
                {user.branch && (
                  <Badge variant="default">
                    {user.branch.name}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AddUserDialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen} />
    </div>
  );
};

export default Users;