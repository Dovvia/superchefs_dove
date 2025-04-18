import { useContext, createContext, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userRoles: (
    "staff" 
    | "baker" 
    | "cleaner" 
    | "sales_rep" 
    | "cook" 
    | "manager" 
    | "procurement" 
    | "accountant" 
    |"maintenance" 
    | "quality_control" 
    | "supplier" 
    | "head_office_supplier" 
    | "area_manager" 
    | "admin"
  )[];
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userRoles: [],
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  useEffect(() => {
    const restoreSession = async () => {
      const { data: session, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error restoring session:", error);
      } else {
        console.log("Session restored:", session);
      }
    };

    restoreSession();
  }, []);

  return context;
};
