import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Timer } from "@/components/Timer";
import { Leaderboard } from "@/components/Leaderboard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { LogOut } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session) {
        navigate("/auth");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleSessionComplete = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-8 pt-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Pomodoro Timer
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user.email?.split("@")[0]}!
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="border-border hover:bg-muted"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </header>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          <div className="flex items-start justify-center">
            <Timer onSessionComplete={handleSessionComplete} />
          </div>
          <div>
            <Leaderboard key={refreshKey} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
