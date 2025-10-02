import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TimerProps {
  onSessionComplete: () => void;
}

export const Timer = ({ onSessionComplete }: TimerProps) => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [showSettings, setShowSettings] = useState(false);

  const totalSeconds = (isBreak ? breakDuration : workDuration) * 60;
  const currentSeconds = minutes * 60 + seconds;
  const progress = ((totalSeconds - currentSeconds) / totalSeconds) * 100;

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            handleSessionComplete();
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, minutes, seconds]);

  const handleSessionComplete = async () => {
    setIsActive(false);
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Please log in to track your sessions");
      return;
    }

    if (!isBreak) {
      const { error } = await supabase.from("study_sessions").insert({
        user_id: user.id,
        duration_minutes: workDuration,
        session_type: "work",
      });

      if (error) {
        toast.error("Failed to save session");
        console.error(error);
      } else {
        toast.success("Work session completed! 🎉");
        onSessionComplete();
      }
    } else {
      toast.success("Break time over! Ready for another session?");
    }

    setIsBreak(!isBreak);
    setMinutes(isBreak ? workDuration : breakDuration);
    setSeconds(0);
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setMinutes(isBreak ? breakDuration : workDuration);
    setSeconds(0);
  };

  const applySettings = () => {
    setMinutes(isBreak ? breakDuration : workDuration);
    setSeconds(0);
    setIsActive(false);
    setShowSettings(false);
    toast.success("Settings updated!");
  };

  return (
    <Card className="relative w-full max-w-md p-8 bg-card border-border overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {isBreak ? "Break Time" : "Focus Time"}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className="hover:bg-muted"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>

        {showSettings ? (
          <div className="space-y-6 animate-fade-in">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Work Duration (minutes)
              </label>
              <input
                type="number"
                value={workDuration}
                onChange={(e) => setWorkDuration(Number(e.target.value))}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                min="1"
                max="60"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Break Duration (minutes)
              </label>
              <input
                type="number"
                value={breakDuration}
                onChange={(e) => setBreakDuration(Number(e.target.value))}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                min="1"
                max="30"
              />
            </div>
            <Button onClick={applySettings} className="w-full">
              Apply Settings
            </Button>
          </div>
        ) : (
          <>
            <div className="relative w-64 h-64 mx-auto mb-8">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="hsl(var(--muted))"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 120}`}
                  strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                  className="transition-all duration-1000"
                  style={{ filter: isActive ? "drop-shadow(var(--glow-primary))" : "none" }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--accent))" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl font-bold tabular-nums">
                    {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {isActive ? "In Progress" : "Ready"}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={toggleTimer}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              >
                {isActive ? (
                  <>
                    <Pause className="mr-2 h-5 w-5" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    Start
                  </>
                )}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={resetTimer}
                className="border-border hover:bg-muted"
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                Reset
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};
