import { useEffect, useState } from "react";
import { timeAgo } from "@/utils/timeUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  CakeIcon,
  ShoppingCart,
  Package,
  Store,
  TrendingUp,
  Users,
  Timer,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { productionData } from "./Production";
import { useUserBranch } from "@/hooks/user-branch";
import { useProductionContext } from "@/context/ProductionContext";
import { Progress } from "@/components/ui/progress";

const Dashboard = () => {
  const { data: userBranch, isLoading: isBranchLoading } = useUserBranch() as {
    data: { name: string; role: string } | null;
    isLoading: boolean;
  };
  const { productionData } = useProductionContext();
  const { toast } = useToast();

  const [recentProduction, setRecentProduction] = useState([]);

  // Real-time subscription for production table
  useEffect(() => {
    const channel = supabase
      .channel("production_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "production",
        },
        (payload) => {
          toast({
            title: "Production Update",
            description: "A production record has been updated.",
          });
          // Refetch recent production activities
          fetchRecentProduction();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // fetchRecentProduction must be stable or wrapped in useCallback to avoid infinite loop
  }, [toast, userBranch]);

  // Move fetchRecentProduction outside useEffect so it can be called from subscription
  const fetchRecentProduction = async () => {
    if (userBranch) {
      try {
        let query = supabase
          .from("production")
          .select(
            `
          id,
          branch_name,
          product_name,
          yield,
          timestamp
        `
          )
          .order("timestamp", { ascending: false }) // by most recent
          .limit(20); // last 20 records

        // If the user is not from HEAD OFFICE, filter by branch
        if (userBranch.name !== "HEAD OFFICE") {
          query = query.eq("branch_name", userBranch.name);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching recent production data:", error);
          return;
        }

        if (!data || data.length === 0) {
          console.warn("No recent production data found.");
          setRecentProduction([]);
          return;
        }

        const recentData = data.map((item) => ({
          branch: item.branch_name || "Unknown Branch",
          productName: item.product_name || "Unknown Product",
          yield: item.yield || 0,
          timestamp: item.timestamp || new Date().toISOString(),
        }));

        setRecentProduction(recentData);
      } catch (err) {
        console.error("Unexpected error fetching recent production data:", err);
      }
    }
  };

  // Update the first useEffect to use fetchRecentProduction
  useEffect(() => {
    fetchRecentProduction();
  }, [userBranch]);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: user, error } = await supabase.auth.getUser();
        if (error) {
          console.error("Error fetching user:", error);
          return;
        }

        const { data: roles, error: roleError } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user?.user?.id);

        if (roleError) {
          console.error("Error fetching user roles:", roleError);
          return;
        }

        console.log("User:", user);
        console.log("Roles:", roles);
      } catch (err) {
        console.error("Unexpected error fetching user and roles:", err);
      }
    };

    fetchUserRole();
  }, []);

  return (
    <div className="space-y-6 p-3 bg-transparent rounded-lg shadow-md w-full mx-auto margin-100">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:bg-green-50 transition-colors cursor-pointer hover:scale-110 hover:shadow-lg transition-transform duration-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Low Stock Items
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Link to="/inventory">
          <Card className="hover:bg-green-50 transition-colors cursor-pointer hover:scale-110 hover:shadow-lg transition-transform duration-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Inventory</CardTitle>
              <Package className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Track and manage your inventory levels
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/products">
          <Card className="hover:bg-green-50 transition-colors cursor-pointer hover:scale-110 hover:shadow-lg transition-transform duration-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Products</CardTitle>
              <CakeIcon className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Track and manage your product catalog
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/sales">
          <Card className="hover:bg-green-50 transition-colors cursor-pointer hover:scale-110 hover:shadow-lg transition-transform duration-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Sales</CardTitle>
              <ShoppingCart className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View and manage sales transactions
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Production Activities */}
      <Card className="col-span-12">
        <CardHeader>
          <CardTitle>Recent Production Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {recentProduction.length === 0 ? (
            <p>No recent production activities.</p>
          ) : (
            <div className="space-y-4">
              {recentProduction.map((record, index) => (
                <div key={index} className="flex border-b-2">
                  <div className="flex w-full items-center justify-between space-y-4">
                    <div className="flex text-sm items-end gap-3 font-medium">
                      <CakeIcon className="h-9 w-9 text-primary" />
                      {record.branch}
                    </div>

                    <p className="text-sm ">
                      <span className="text-sm font-bold">
                        {record.yield} {""}
                      </span>
                      {record.productName}
                    </p>
                    <div className="flex items-center">
                      <p className="text-sm font-bold">
                        {timeAgo(record.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
