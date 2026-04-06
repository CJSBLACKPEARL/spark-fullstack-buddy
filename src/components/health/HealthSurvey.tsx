import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, Dumbbell } from "lucide-react";

interface HealthSurveyProps {
  onComplete: (answers: Record<string, string>) => void;
}

const surveySteps = [
  {
    key: "goal",
    question: "What is your primary fitness goal?",
    options: ["Lose Weight", "Build Muscle", "Improve Stamina", "Stay Fit & Healthy", "Sports Training"],
    allowCustom: true,
  },
  {
    key: "age",
    question: "What is your age?",
    inputType: "number" as const,
    placeholder: "e.g. 25",
  },
  {
    key: "weight",
    question: "What is your current weight (in kg)?",
    inputType: "number" as const,
    placeholder: "e.g. 70",
  },
  {
    key: "height",
    question: "What is your height (in cm)?",
    inputType: "number" as const,
    placeholder: "e.g. 170",
  },
  {
    key: "activity_level",
    question: "What is your current activity level?",
    options: ["Sedentary (little or no exercise)", "Lightly Active (1-2 days/week)", "Moderately Active (3-5 days/week)", "Very Active (6-7 days/week)", "Athlete / Intense Training"],
  },
  {
    key: "medical_conditions",
    question: "Do you have any pre-existing medical conditions?",
    options: ["None", "Diabetes", "Heart Condition", "High Blood Pressure", "Asthma", "Joint/Back Issues"],
    allowMultiple: true,
    allowCustom: true,
  },
  {
    key: "allergies",
    question: "Do you have any food allergies or dietary restrictions?",
    options: ["None", "Lactose Intolerant", "Gluten-Free", "Nut Allergy", "Vegetarian", "Vegan"],
    allowMultiple: true,
    allowCustom: true,
  },
  {
    key: "diet_preference",
    question: "What is your preferred cuisine / diet style?",
    options: ["Indian", "Mediterranean", "Asian", "Western / Continental", "No Preference"],
    allowCustom: true,
  },
];

const HealthSurvey = ({ onComplete }: HealthSurveyProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [inputValue, setInputValue] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");

  const step = surveySteps[currentStep];
  const progress = ((currentStep) / surveySteps.length) * 100;

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
    if (step.inputType) {
      value = inputValue;
    } else if (step.allowMultiple) {
      const all = [...selectedOptions];
      if (customInput.trim()) all.push(customInput.trim());
      value = all.join(", ");
    }

    if (!value.trim()) return;

    const newAnswers = { ...answers, [step.key]: value };
    setAnswers(newAnswers);
    setInputValue("");
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
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground">
        <div className="flex items-center gap-3 mb-3">
          <Dumbbell className="h-6 w-6" />
          <h2 className="text-xl font-bold">Health & Fitness Profile</h2>
        </div>
        <p className="text-sm opacity-90">Let's understand your needs to create a personalized plan</p>
        {/* Progress bar */}
        <div className="mt-4 h-2 bg-primary-foreground/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-foreground/80 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs mt-1.5 opacity-75">
          Question {currentStep + 1} of {surveySteps.length}
        </p>
      </div>

      {/* Completed answers */}
      {currentStep > 0 && (
        <div className="px-6 pt-4 flex flex-wrap gap-2">
          {Object.entries(answers).map(([key, val]) => {
            const label = surveySteps.find((s) => s.key === key)?.question.split("?")[0].replace("What is your ", "").replace("Do you have any ", "");
            return (
              <Badge key={key} variant="secondary" className="text-xs gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {label}: {val}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Current question */}
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">{step.question}</h3>

        {step.inputType ? (
          <div className="flex gap-2">
            <Input
              type={step.inputType}
              placeholder={step.placeholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNext()}
              className="flex-1"
              autoFocus
            />
            <Button onClick={handleNext} disabled={!inputValue.trim()} variant="gradient">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
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
        )}
      </div>
    </Card>
  );
};

export default HealthSurvey;
