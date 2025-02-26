import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth";
import NotificationBell from "./NotificationBell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import UserMenu from "./UserMenu";

interface HeaderProps {
  onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const { session } = useAuth();

  const { data: userBranch } = useQuery({
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
      console.log("userBranch:", userBranch);
      console.log("branchId:", userBranch?.id);
      return data?.branches;
    },
    enabled: !!session?.user?.id,
  });

  return (
    <header
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      style={{
        boxShadow: "0 2px 6px #4CAF50",
      }}
    >
      <div className="container flex h-14 items-center justify-between">
        <Button
          variant="ghost"
          // className="mr-2 px-2 lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-6 w-6" />
        </Button>
        <div className="flex items-center space-x-4">
          {userBranch && (
            <span className="text-sm text-muted-foreground">
              Branch: {userBranch.name}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {session && userBranch?.id && (
            <NotificationBell branchId={userBranch.id} />
          )}
          {/* <NotificationBell /> */}
          {session && <UserMenu />}
        </div>
      </div>
    </header>
  );
};

export default Header;
