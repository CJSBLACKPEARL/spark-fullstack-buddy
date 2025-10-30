import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dumbbell, GraduationCap, Heart, Sparkles, ArrowRight } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBanner})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-secondary/90" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center text-primary-foreground">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-3xl">
              <Sparkles className="h-16 w-16" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            PeakPerform AI
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            Balance your fitness, academics, and mental wellness with AI-powered personalized guidance
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate("/auth")}
              variant="hero"
              size="lg"
              className="text-lg px-8 py-6"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-muted/50 to-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-4">
            Everything You Need in One Place
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            PeakPerform AI combines AI-powered tools for health, academics, and wellness to help you achieve your goals
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-card rounded-2xl p-8 shadow-card hover:shadow-elegant transition-all border border-border">
              <div className="p-4 bg-gradient-to-br from-primary to-primary-glow rounded-2xl w-fit mb-6">
                <Dumbbell className="h-10 w-10 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Health & Fitness</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  Personalized workout plans by sport
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  Custom diet recommendations
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  Sport-specific training guidance
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">✓</span>
                  Progress tracking and analytics
                </li>
              </ul>
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-card hover:shadow-elegant transition-all border border-border">
              <div className="p-4 bg-gradient-to-br from-secondary to-accent rounded-2xl w-fit mb-6">
                <GraduationCap className="h-10 w-10 text-secondary-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Academic Support</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start">
                  <span className="text-secondary mr-2">✓</span>
                  AI test generation from notes
                </li>
                <li className="flex items-start">
                  <span className="text-secondary mr-2">✓</span>
                  Presentation and PPT creation
                </li>
                <li className="flex items-start">
                  <span className="text-secondary mr-2">✓</span>
                  Mind map builder for concepts
                </li>
                <li className="flex items-start">
                  <span className="text-secondary mr-2">✓</span>
                  Personalized learning roadmaps
                </li>
              </ul>
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-card hover:shadow-elegant transition-all border border-border">
              <div className="p-4 bg-gradient-to-br from-accent to-primary rounded-2xl w-fit mb-6">
                <Heart className="h-10 w-10 text-accent-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Mental Wellness</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start">
                  <span className="text-accent mr-2">✓</span>
                  Stress management techniques
                </li>
                <li className="flex items-start">
                  <span className="text-accent mr-2">✓</span>
                  Motivational support system
                </li>
                <li className="flex items-start">
                  <span className="text-accent mr-2">✓</span>
                  Work-life balance guidance
                </li>
                <li className="flex items-start">
                  <span className="text-accent mr-2">✓</span>
                  Daily wellness check-ins
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h2 className="text-4xl font-bold mb-6">Privacy First</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Your data security is our top priority. PeakPerform AI uses end-to-end encryption and multi-factor authentication to keep your personal information safe. We never share your data with third parties.
          </p>
          <Button 
            onClick={() => navigate("/auth")}
            variant="gradient"
            size="lg"
            className="text-lg px-8 py-6"
          >
            Start Your Journey
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
