import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth";
import NotificationBell from "./NotificationBell";
import UserMenu from "./UserMenu";
import { useUserBranch } from "@/hooks/user-branch";

interface HeaderProps {
  onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const { session } = useAuth();
  const { data: userBranch } = useUserBranch();

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
