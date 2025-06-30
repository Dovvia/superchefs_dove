import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff } from "lucide-react";
import PWAInstallButton from "../components/PWAInstallButton";
const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth
      .signOut()
      .then((error) => !error && console.error("Error logging out: ", error));
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (isLogin) {
        console.log("🔐 Auth: Attempting login with email:", email);
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error("❌ Auth: Login error:", error.message);
          throw error;
        }

        if (data?.user) {
          toast({
            title: "Welcome back!",
            description: "Login successful",
          });
        } else {
          console.warn("⚠️ Auth: Login successful but no user data returned");
          toast({
            title: "Warning",
            description: "Authentication successful, but user data is missing",
          });
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) {
          console.error("❌ Auth: Signup error:", error.message);
          throw error;
        }
        toast({
          title: "Success",
          description: "Please check your email to verify your account.",
        });
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Could not connect to authentication service";
      console.error("❌ Auth: Authentication error:", errorMessage);
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent py-12 px-4 sm:px-6 lg:px-8">
      <PWAInstallButton />
      <div className="max-w-md w-full space-y-8">
        <img
          src="/superchefs-logo.png"
          alt="SuperChefs Logo"
          className="w-[70px] h-[100px] rounded-full mx-auto"
        />
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isLogin ? "Sign in to your account" : "Create a new account"}
          </h2>
          {/* <p className="mt-2 text-center text-sm text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-primary hover:text-primary/90"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p> */}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          <div className="rounded-md shadow-sm space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-8 px-3 text-gray-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? isLogin
                  ? (
                      <div className="flex justify-center items-center">
                        Signing in
                        <div className="animate-spin rounded-full text-white h-8 w-8 border-t-2 border-b-2  border-white"></div>
                      </div>
                    )
                  : "Creating account..."
                : isLogin
                ? "Sign in"
                : "Create account"}
            </Button>
          </div>
        </form>
      </div>
      <div className="w-full fixed bottom-0 bg-[#f0fff0] text-center py-2">
        © dovvia 2025, All Rights Reserved
      </div>
    </div>
  );
};

export default Auth;
