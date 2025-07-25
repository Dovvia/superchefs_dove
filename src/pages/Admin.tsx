import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import UserManagement from "../components/admin/UserManagement";
import BranchAnalytics from "@/components/admin/BranchAnalytics";
import { useAuth } from "@/hooks/auth";
import { Navigate } from "react-router-dom";
import { Users, BarChart, BarChartIcon } from "lucide-react";

const Admin = () => {
  const { userRoles } = useAuth();
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [activeTab, setActiveTab] = useState("users");

  const handleTabChange = (value: string) => {
    console.log("Changing tab to:", value);
    setActiveTab(value);
  };

  return (
    <div className="space-y-6 p-3 bg-transparent rounded-lg shadow-md w-full mx-auto margin-100">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

      <Tabs
        defaultValue="users"
        value={activeTab}
        onValueChange={handleTabChange}
      >
        <div className="mb-6">
          <TabsList className="grid w-full md:w-auto md:inline-flex grid-cols-2 md:grid-cols-none h-auto gap-4 p-1">
            <TabsTrigger
              value="users"
              className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Users className="h-4 w-4" />
              <span>User Management</span>
            </TabsTrigger>
            <TabsTrigger
              value="branches"
              className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <BarChartIcon className="h-4 w-4" />
              <span>Branch Analytics</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Create users, assign roles and branches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Branch Analytics</CardTitle>
              <CardDescription>
                View sales, inventory, and financial data across branches
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingBranches ? (
                <div className="flex justify-center items-center">
                  Loading
                  <div className="animate-spin rounded-full text-green-500 h-8 w-8 border-t-2 border-b-2  border-green-500"></div>
                </div>
              ) : (
                <BranchAnalytics />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
