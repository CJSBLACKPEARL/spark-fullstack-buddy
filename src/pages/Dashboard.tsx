import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dumbbell, GraduationCap, Heart, Sparkles, LogOut, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ChatInterface from "@/components/ChatInterface";
import ConversationHistory from "@/components/ConversationHistory";
import HealthSurvey from "@/components/health/HealthSurvey";
import WellnessSurvey from "@/components/wellness/WellnessSurvey";
import AcademicHub from "./AcademicHub";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [activeCategory, setActiveCategory] = useState<"health" | "academic" | "wellness" | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [healthSurveyDone, setHealthSurveyDone] = useState(false);
  const [healthContext, setHealthContext] = useState<string | undefined>(undefined);
  const [wellnessSurveyDone, setWellnessSurveyDone] = useState(false);
  const [wellnessContext, setWellnessContext] = useState<string | undefined>(undefined);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-primary to-secondary rounded-xl">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                PeakPerform AI
              </h1>
              <p className="text-sm text-muted-foreground">Welcome back, {user.user_metadata?.full_name || user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowHistory(!showHistory)} variant="outline" size="sm">
              <History className="h-4 w-4 mr-2" />
              {showHistory ? "Hide History" : "View History"}
            </Button>
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {showHistory ? (
          <div>
            <ConversationHistory userId={user.id} />
          </div>
        ) : !activeCategory ? (
          <div className="grid md:grid-cols-3 gap-6">
            <Card 
              className="cursor-pointer hover:shadow-elegant transition-all border-2 hover:border-primary/50"
              onClick={() => setActiveCategory("health")}
            >
              <CardHeader>
                <div className="p-3 bg-gradient-to-br from-primary to-primary-glow rounded-xl w-fit mb-4">
                  <Dumbbell className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle>Health & Fitness</CardTitle>
                <CardDescription>
                  Get personalized workout plans, diet recommendations, and sport-specific training guidance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="gradient" className="w-full">
                  Start Training
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-elegant transition-all border-2 hover:border-secondary/50"
              onClick={() => setActiveCategory("academic")}
            >
              <CardHeader>
                <div className="p-3 bg-gradient-to-br from-secondary to-accent rounded-xl w-fit mb-4">
                  <GraduationCap className="h-8 w-8 text-secondary-foreground" />
                </div>
                <CardTitle>Academic Support</CardTitle>
                <CardDescription>
                  Upload documents to generate flashcards, quizzes & study notes. Chat with AI for academic help and track your progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="gradient" className="w-full">
                  Start Learning
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-elegant transition-all border-2 hover:border-accent/50"
              onClick={() => setActiveCategory("wellness")}
            >
              <CardHeader>
                <div className="p-3 bg-gradient-to-br from-accent to-primary rounded-xl w-fit mb-4">
                  <Heart className="h-8 w-8 text-accent-foreground" />
                </div>
                <CardTitle>Mental Wellness</CardTitle>
                <CardDescription>
                  Get stress management tips, motivational support, and guidance for work-life balance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="gradient" className="w-full">
                  Find Balance
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div>
            {activeCategory === "academic" ? (
              <AcademicHub user={user} onBack={() => setActiveCategory(null)} />
            ) : activeCategory === "health" && !healthSurveyDone ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => { setActiveCategory(null); setHealthSurveyDone(false); setHealthContext(undefined); }}
                  className="mb-6"
                >
                  ← Back to Categories
                </Button>
                <HealthSurvey onComplete={(answers) => {
                  const context = `Here is my health profile:\n- **Goal**: ${answers.goal}\n- **Age**: ${answers.age} years\n- **Weight**: ${answers.weight} kg\n- **Height**: ${answers.height} cm\n- **Activity Level**: ${answers.activity_level}\n- **Medical Conditions**: ${answers.medical_conditions}\n- **Allergies/Dietary Restrictions**: ${answers.allergies}\n- **Diet Preference**: ${answers.diet_preference}\n\nBased on this profile, please create a personalized fitness and nutrition plan for me. Include a weekly workout schedule and a sample meal plan in table format.`;
                  setHealthContext(context);
                  setHealthSurveyDone(true);
                }} />
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => { setActiveCategory(null); setHealthSurveyDone(false); setHealthContext(undefined); }}
                  className="mb-6"
                >
                  ← Back to Categories
                </Button>
                <ChatInterface category={activeCategory!} userId={user.id} initialContext={healthContext} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;