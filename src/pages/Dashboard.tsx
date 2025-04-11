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
  Clock,
  Clock10,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { productionData } from "./Production";
import { useUserBranch } from "@/hooks/user-branch";
import { useProductionContext } from "@/context/ProductionContext";

const salesData = [
  { name: "Jan", sales: 4000 },
  { name: "Feb", sales: 3000 },
  { name: "Mar", sales: 2000 },
  { name: "Apr", sales: 2780 },
  { name: "May", sales: 1890 },
  { name: "Jun", sales: 2390 },
];

const productData = [
  { name: "Cakes", value: 400 },
  { name: "Pastries", value: 300 },
  { name: "Bread", value: 300 },
  { name: "Cookies", value: 200 },
];

const branchPerformance = [
  { name: "North", value: 35 },
  { name: "South", value: 25 },
  { name: "East", value: 20 },
  { name: "West", value: 20 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const Dashboard = () => {
  const { data: userBranch, isLoading: isBranchLoading } = useUserBranch() as {
    data: { name: string } | null;
    isLoading: boolean;
  };
  const { productionData } = useProductionContext();

  const [recentProduction, setRecentProduction] = useState([]);

  useEffect(() => {
    const fetchRecentProduction = async () => {
      if (userBranch) {
        try {
          const { data, error } = await supabase
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
            .eq("branch_name", userBranch?.name)
            .order("timestamp", { ascending: false }) // by most recent
            .limit(20); // last 20 records

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
          console.error(
            "Unexpected error fetching recent production data:",
            err
          );
        }
      }
    };

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
          .from("user_roles")
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
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦45,231.89</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products Sold</CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2350</div>
            <p className="text-xs text-muted-foreground">
              +180.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Branches
            </CardTitle>
            <Store className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">40</div>
            <p className="text-xs text-muted-foreground">+2 new branches</p>
          </CardContent>
        </Card>

        <Card>
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
      </div>

      {/* Quick Access Navigation */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link to="/branches">
          <Card className="hover:bg-secondary transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Branches</CardTitle>
              <Store className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage your bakery branches and locations
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/inventory">
          <Card className="hover:bg-secondary transition-colors cursor-pointer">
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
          <Card className="hover:bg-secondary transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Products</CardTitle>
              <CakeIcon className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage your product catalog
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/sales">
          <Card className="hover:bg-secondary transition-colors cursor-pointer">
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

        <Link to="/users">
          <Card className="hover:bg-secondary transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Users</CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage staff and user accounts
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12">
        <Card className="col-span-12 md:col-span-6">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#4CAF50"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-12 md:col-span-6">
          <CardHeader>
            <CardTitle>Product Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={productData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#4CAF50" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-12 md:col-span-6">
          <CardHeader>
            <CardTitle>Product Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={productData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {productData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-12 md:col-span-6">
          <CardHeader>
            <CardTitle>Branch Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={branchPerformance}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {branchPerformance.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Production Activities */}
        <Card className="col-span-12">
          <CardHeader>
            <CardTitle>Recent Production Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {productionData.length === 0 ? (
              <p>No recent production activities.</p>
            ) : (
              <div className="space-y-4">
                {productionData.map((record, index) => (
                  <div key={index} className="flex border-b-2">
                    <div className="flex w-full items-center justify-between space-y-4">
                      <div className="flex text-sm items-end gap-3 font-medium">
                        <CakeIcon className="h-9 w-9 text-primary" />
                        {record.branch}
                        {/* <p className="text-xs text-muted-foreground">
                          was producing
                        </p> */}
                      </div>

                      <p className="text-sm ">
                        <span className="text-sm font-bold">
                          {record.yield} {""}
                        </span>
                        {record.productName}
                      </p>
                      <div className="flex items-center">
                        {/* <Clock /> */}
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
    </div>
  );
};

export default Dashboard;
