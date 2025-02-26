import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Boxes,
  Luggage,
  Utensils,
  Users,
  Building2,
  Factory,
  ScrollText,
  PackageSearch,
  DollarSign,
  X,
  PackageMinusIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Inventory",
      href: "/inventory",
      icon: Package,
    },
    {
      name: "Products",
      href: "/products",
      icon: PackageSearch,
    },
    {
      name: "Sales",
      href: "/sales",
      icon: ShoppingCart,
    },
    {
      name: "Procurement",
      href: "/procurement",
      icon: Boxes,
    },
    {
      name: "Damages",
      href: "/damages",
      icon: PackageMinusIcon,
    },
    {
      name: "Accounts",
      href: "/accounts",
      icon: DollarSign,
    },
    {
      name: "Users",
      href: "/users",
      icon: Users,
    },
    {
      name: "Branches",
      href: "/branches",
      icon: Building2,
    },
    {
      name: "Production",
      href: "/production",
      icon: Utensils,
    },
    {
      name: "Recipes",
      href: "/recipes",
      icon: ScrollText,
    },
  ];

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg: ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } lg:`}
    >
      <div className="space-y-4 py-4 bg-white h-full shadow-lg">
        <div className="flex items-center justify-between px-3 lg:">
          <img
            src="/superchefs-logo.png"
            style={{ width: "40px", height: "50px" }}
          />
          <Button variant="secondary" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="px-3 py-2">
          <div className="space-y-3">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground transform hover:translate-x-1 ${
                    isActive ? "bg-accent translate-x-1" : "translate-x-0"
                  }`
                }
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.name}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
