import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, Heart } from "lucide-react";

interface WellnessSurveyProps {
  onComplete: (answers: Record<string, string>) => void;
}

const surveySteps = [
  {
    key: "primary_concern",
    question: "What is your primary mental wellness concern?",
    options: ["Stress & Anxiety", "Low Motivation", "Sleep Issues", "Work-Life Balance", "Loneliness / Isolation"],
    allowCustom: true,
  },
  {
    key: "stress_level",
    question: "How would you rate your current stress level?",
    options: ["Very Low (1-2)", "Low (3-4)", "Moderate (5-6)", "High (7-8)", "Very High (9-10)"],
  },
  {
    key: "sleep_quality",
    question: "How would you describe your sleep quality?",
    options: ["Excellent (7-9 hrs, restful)", "Good (6-7 hrs, mostly fine)", "Average (5-6 hrs, disrupted)", "Poor (< 5 hrs or very restless)", "Insomnia / Severe issues"],
  },
  {
    key: "physical_activity",
    question: "How often do you engage in physical activity?",
    options: ["Daily", "3-5 times/week", "1-2 times/week", "Rarely", "Never"],
  },
  {
    key: "social_support",
    question: "How would you describe your social support system?",
    options: ["Strong (close friends & family)", "Moderate (a few people I trust)", "Weak (limited support)", "Isolated (no support system)"],
  },
  {
    key: "mental_health_history",
    question: "Do you have any diagnosed mental health conditions?",
    options: ["None", "Depression", "Anxiety Disorder", "ADHD", "PTSD", "Bipolar Disorder"],
    allowMultiple: true,
    allowCustom: true,
  },
  {
    key: "coping_methods",
    question: "What do you currently do to manage stress?",
    options: ["Meditation / Yoga", "Exercise", "Talking to someone", "Journaling", "Nothing specific", "Social media / Entertainment"],
    allowMultiple: true,
    allowCustom: true,
  },
  {
    key: "wellness_goal",
    question: "What outcome do you want most from wellness support?",
    options: ["Reduce Anxiety & Stress", "Better Sleep", "Improved Focus & Productivity", "Emotional Resilience", "Healthier Relationships"],
    allowCustom: true,
  },
];

const WellnessSurvey = ({ onComplete }: WellnessSurveyProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");

  const step = surveySteps[currentStep];
  const progress = (currentStep / surveySteps.length) * 100;

  const handleOptionSelect = (option: string) => {
    if (step.allowMultiple) {
      setSelectedOptions((prev) =>
        prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
      );
    } else {
      setAnswers({ ...answers, [step.key]: option });
      if (currentStep < surveySteps.length - 1) {
        setCurrentStep(currentStep + 1);
        setSelectedOptions([]);
        setCustomInput("");
      } else {
        onComplete({ ...answers, [step.key]: option });
      }
    }
  };

  const handleNext = () => {
    let value = "";
    if (step.allowMultiple) {
      const all = [...selectedOptions];
      if (customInput.trim()) all.push(customInput.trim());
      value = all.join(", ");
    }

    if (!value.trim()) return;

    const newAnswers = { ...answers, [step.key]: value };
    setAnswers(newAnswers);
    setSelectedOptions([]);
    setCustomInput("");

    if (currentStep < surveySteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(newAnswers);
    }
  };

  return (
    <Card className="shadow-elegant overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-accent to-primary text-accent-foreground">
        <div className="flex items-center gap-3 mb-3">
          <Heart className="h-6 w-6" />
          <h2 className="text-xl font-bold">Mental Wellness Profile</h2>
        </div>
        <p className="text-sm opacity-90">Help us understand your needs for personalized wellness guidance</p>
        <div className="mt-4 h-2 bg-accent-foreground/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-foreground/80 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs mt-1.5 opacity-75">
          Question {currentStep + 1} of {surveySteps.length}
        </p>
      </div>

      {currentStep > 0 && (
        <div className="px-6 pt-4 flex flex-wrap gap-2">
          {Object.entries(answers).map(([key, val]) => {
            const label = surveySteps
              .find((s) => s.key === key)
              ?.question.split("?")[0]
              .replace("How would you ", "")
              .replace("What is your ", "")
              .replace("Do you have any ", "")
              .replace("What do you currently ", "")
              .replace("What outcome do you ", "");
            return (
              <Badge key={key} variant="secondary" className="text-xs gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {label}: {val}
              </Badge>
            );
          })}
        </div>
      )}

      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">{step.question}</h3>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {step.options?.map((option) => (
              <Button
                key={option}
                variant={
                  step.allowMultiple
                    ? selectedOptions.includes(option)
                      ? "default"
                      : "outline"
                    : "outline"
                }
                className="justify-start h-auto py-3 px-4 text-left text-sm whitespace-normal"
                onClick={() => handleOptionSelect(option)}
              >
                {option}
              </Button>
            ))}
          </div>

          {step.allowCustom && (
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Other (type here)..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="flex-1"
              />
            </div>
          )}

          {step.allowMultiple && (
            <Button
              onClick={handleNext}
              disabled={selectedOptions.length === 0 && !customInput.trim()}
              variant="gradient"
              className="w-full mt-2"
            >
              Continue <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default WellnessSurvey;
