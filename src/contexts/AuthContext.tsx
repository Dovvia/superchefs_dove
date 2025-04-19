import { useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext } from "@/hooks/auth";
import { UserRole } from "@/types/users";

// export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
//   const [session, setSession] = useState<Session | null>(null);
//   const [user, setUser] = useState<User | null>(null);
//   const [userRoles, setUserRoles] = useState<("admin" | "staff" | "manager")[]>(
//     []
//   );

//   useEffect(() => {
//     // Get initial session
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       setSession(session);
//       setUser(session?.user ?? null);
//       if (session?.user) {
//         fetchUserRoles(session.user.id);
//       }
//     });

//     // Listen for auth changes
//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange( async (_event, session) => {
//       setSession(session);
//       setUser(session?.user ?? null);
//       if (session?.user) {
//         await fetchUserRoles(session.user.id);
//       } else {
//         setUserRoles([]);
//       }
//     });

//     return () => subscription.unsubscribe();
//   }, []);

//   const fetchUserRoles = async (userId: string) => {
//     const { data, error } = await supabase
//       .from("user_roles")
//       .select("role")
//       .eq("user_id", userId);

//     if (error) {
//       console.error("Error fetching user roles:", error);
//       return;
//     }

//     setUserRoles(data.map((r) => r.role));
//   };

//   const signOut = async () => {
//     await supabase.auth.signOut();
//   };

//   return (
//     <AuthContext.Provider value={{ session, user, userRoles, signOut }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        setIsLoading(true);

        // Get current session
        const {
          data: { session: currentSession },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          return;
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await fetchUserRoles(currentSession.user.id);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      console.log("Auth state changed:", _event, newSession?.user?.id);

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await fetchUserRoles(newSession.user.id);
      } else {
        setUserRoles(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching user roles:", error);
        return;
      }
      console.log("role: ", data);
      if (data) {
        setUserRoles(data?.[0]?.role as UserRole);
      }
    } catch (error) {
      console.error("Failed to fetch user roles:", error);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, userRoles, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
