import {
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { ProductionProvider } from "@/context/ProductionContext";
import PWAInstallButton from "@/components/PWAInstallButton";
import IosInstallPrompt from "./components/IosInstallPrompt";
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
import Records from "./pages/Records";
import Damages from "./pages/Damages";
import Recipes from "./pages/Recipes";
import Accounts from "./pages/Accounts";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import ImprestManagement from "./pages/ImprestManagement";
import { registerSW } from 'virtual:pwa-register';

const queryClient = new QueryClient();

function App() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const updateSW = registerSW({
      onNeedRefresh() {
        setUpdateAvailable(true);
      },
      onOfflineReady() {
        console.log("App ready for offline usage.");
      },
    });
    // return () => updateSW?.unregister?.();
  }, []);

  const refreshApp = () => {
    window.location.reload();
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <ProductionProvider>
            <PWAInstallButton />
            <IosInstallPrompt />
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
                <Route path="settings" element={<Settings />} />
                <Route
                  path="inventory"
                  element={
                    <RoleProtectedRoute allowedRoles={["manager", "admin", "quality_control"]}>
                      <Inventory />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="products"
                  element={
                    <RoleProtectedRoute allowedRoles={["manager", "admin", "quality_control"]}>
                      <Products />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="sales"
                  element={
                    <RoleProtectedRoute allowedRoles={["sales_rep", "manager", "admin"]}>
                      <Sales />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="damages"
                  element={
                    <RoleProtectedRoute allowedRoles={["baker", "cook", "manager", "admin"]}>
                      <Damages />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="production"
                  element={
                    <RoleProtectedRoute allowedRoles={["baker", "cook", "manager", "admin"]}>
                      <Production />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="Records"
                  element={
                    <RoleProtectedRoute allowedRoles={["manager", "admin"]}>
                      <Records />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="material-request"
                  element={
                    <RoleProtectedRoute allowedRoles={["manager"]}>
                      <MaterialRequest />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="imprest-request"
                  element={
                    <RoleProtectedRoute allowedRoles={["manager"]}>
                      <Imprest />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="admin"
                  element={
                    <RoleProtectedRoute allowedRoles={["admin"]}>
                      <Admin />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="manage-imprest"
                  element={
                    <RoleProtectedRoute allowedRoles={["admin"]}>
                      <ImprestManagement />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="recipes"
                  element={
                    <RoleProtectedRoute allowedRoles={["admin", "quality_control"]}>
                      <Recipes />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="procurement"
                  element={
                    <RoleProtectedRoute allowedRoles={["admin", "procurement"]}>
                      <Procurement />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="users"
                  element={
                    <RoleProtectedRoute allowedRoles={["admin"]}>
                      <Users />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="branches"
                  element={
                    <RoleProtectedRoute allowedRoles={["admin"]}>
                      <Branches />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="accounts"
                  element={
                    <RoleProtectedRoute allowedRoles={["admin", "accountant"]}>
                      <Accounts />
                    </RoleProtectedRoute>
                  }
                />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            {updateAvailable && (
              <div className="fixed bottom-4 right-4 p-4 bg-blue-600 text-white rounded-lg shadow-lg z-50">
                <p>🔄 A new version of Dovvia is available!</p>
                <button
                  onClick={refreshApp}
                  className="mt-2 bg-white text-blue-600 px-4 py-1 rounded"
                >
                  Update Now
                </button>
              </div>
            )}
          </ProductionProvider>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
