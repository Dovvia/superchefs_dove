import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";

import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Products from "./pages/Products";
import Sales from "./pages/Sales";
import Procurement from "./pages/Procurement";
import Users from "./pages/Users";
import Branches from "./pages/Branches";
import MaterialRequest from "./pages/MaterialRequest";
import Imprest from "./pages/imprest";
import Production from "./pages/Production";
import Damages from "./pages/Damages";
import Recipes from "./pages/Recipes";
import Accounts from "./pages/Accounts";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import ImprestManagement from "./pages/ImprestManagement";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="products" element={<Products />} />
                <Route path="sales" element={<Sales />} />
                <Route path="material-request" element={<MaterialRequest />} />
                <Route path="imprest-request" element={<Imprest />} />
                <Route path="procurement" element={<Procurement />} />
                <Route path="manage-imprest" element={<ImprestManagement />} />
                <Route path="damages" element={<Damages />} />
                <Route path="users" element={<Users />} />
                <Route path="accounts" element={<Accounts />} />
                <Route path="branches" element={<Branches />} />
                <Route path="production" element={<Production />} />
                <Route path="recipes" element={<Recipes />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />

                {/* <Route 
                  path="users" 
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <Users />
                    </RoleProtectedRoute>
                  } 
                />
                <Route 
                  path="branches" 
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <Branches />
                    </RoleProtectedRoute>
                  } 
                />
               
                <Route 
                  path="accounts" 
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <Accounts />
                    </RoleProtectedRoute>
                  } 
                /> */}
              </Route>
            </Routes>
          </BrowserRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
