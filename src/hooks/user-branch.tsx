import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/auth"; // Adjust the path based on your project structure
import { supabase } from "@/integrations/supabase/client"; // Adjust the path based on your project structure

export const useUserBranch = () => {
  const { session } = useAuth();

  return useQuery({
    queryKey: ["user-branch", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;

      const { data, error } = await supabase
        .from("user_roles")
        .select(
          `
          *,
          branches (*)
        `
        )
        .eq("user_id", session.user.id)
        .single();

      if (error) {
        console.error("Error fetching user branch:", error);
        return null;
      }

      console.log("userBranch:", data?.branches);
      console.log("branchId:", data?.branches?.id);
      return data?.branches;
    },
    enabled: !!session?.user?.id,
  });
};
