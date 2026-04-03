import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, FileQuestion, Play, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  questions: any;
  created_at: string;
  source_type: string | null;
}

interface QuizGeneratorProps {
  userId: string;
}

const QuizGenerator = ({ userId }: QuizGeneratorProps) => {
  const [topic, setTopic] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const { toast } = useToast();

  const fetchQuizzes = async () => {
    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) setQuizzes(data);
  };

  useEffect(() => { fetchQuizzes(); }, [userId]);

  const generateQuiz = async () => {
    if (!topic.trim()) {
      toast({ title: "Topic required", description: "Please enter a topic.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: { topic, questionCount, difficulty, userId },
      });

      if (error) throw error;

      toast({ title: "Quiz generated!", description: `Created a ${questionCount}-question quiz on "${topic}"` });
      setTopic("");
      fetchQuizzes();
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast({ title: "Error", description: "Failed to generate quiz.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const startQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentQ(0);
    setSelectedAnswer(null);
    setAnswers({});
    setShowResult(false);
    setQuizComplete(false);
  };

  const submitAnswer = () => {
    if (selectedAnswer === null) return;
    const newAnswers = { ...answers, [currentQ]: selectedAnswer };
    setAnswers(newAnswers);
    setShowResult(true);
  };

  const nextQuestion = () => {
    const questions = activeQuiz?.questions as any[];
    if (currentQ + 1 >= questions.length) {
      // Quiz complete - save results
      const score = Object.entries(answers).filter(
        ([idx, ans]) => (activeQuiz?.questions as any[])[parseInt(idx)].correctAnswer === ans
      ).length;
      // include current answer
      const finalAnswers = { ...answers, [currentQ]: selectedAnswer! };
      const finalScore = Object.entries(finalAnswers).filter(
        ([idx, ans]) => (activeQuiz?.questions as any[])[parseInt(idx)].correctAnswer === ans
      ).length;

      supabase.from("quiz_results").insert({
        user_id: userId,
        quiz_id: activeQuiz!.id,
        score: finalScore,
        total_questions: questions.length,
        answers: finalAnswers,
      }).then(() => {});

      setQuizComplete(true);
      setAnswers(finalAnswers);
    } else {
      setCurrentQ(currentQ + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const deleteQuiz = async (id: string) => {
    await supabase.from("quizzes").delete().eq("id", id);
    fetchQuizzes();
  };

  // Active quiz view
  if (activeQuiz) {
    const questions = activeQuiz.questions as any[];

    if (quizComplete) {
      const score = Object.entries(answers).filter(
        ([idx, ans]) => questions[parseInt(idx)].correctAnswer === ans
      ).length;
      const pct = Math.round((score / questions.length) * 100);

      return (
        <Card>
          <CardHeader>
            <CardTitle>Quiz Complete! 🎉</CardTitle>
            <CardDescription>{activeQuiz.title}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-4xl font-bold">{score}/{questions.length}</p>
              <Progress value={pct} className="h-3" />
              <Badge variant={pct >= 80 ? "default" : pct >= 60 ? "secondary" : "destructive"} className="text-lg px-4 py-1">
                {pct}%
              </Badge>
            </div>
            <div className="space-y-3">
              {questions.map((q: any, idx: number) => {
                const isCorrect = answers[idx] === q.correctAnswer;
                return (
                  <div key={idx} className={`p-3 rounded-lg border ${isCorrect ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"}`}>
                    <div className="flex items-start gap-2">
                      {isCorrect ? <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" /> : <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />}
                      <div>
                        <p className="font-medium text-sm">{q.question}</p>
                        {!isCorrect && <p className="text-xs text-muted-foreground mt-1">Correct: {q.options[q.correctAnswer]}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button className="w-full" onClick={() => setActiveQuiz(null)}>Back to Quizzes</Button>
          </CardContent>
        </Card>
      );
    }

    const question = questions[currentQ];
    const isCorrect = showResult && selectedAnswer === question.correctAnswer;

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{activeQuiz.title}</CardTitle>
            <Badge variant="outline">Q{currentQ + 1}/{questions.length}</Badge>
          </div>
          <Progress value={((currentQ + 1) / questions.length) * 100} className="h-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="font-medium text-lg">{question.question}</p>
          <div className="space-y-2">
            {question.options.map((opt: string, idx: number) => {
              let variant: "outline" | "default" | "destructive" | "secondary" = "outline";
              if (showResult) {
                if (idx === question.correctAnswer) variant = "default";
                else if (idx === selectedAnswer) variant = "destructive";
              } else if (idx === selectedAnswer) {
                variant = "secondary";
              }

              return (
                <Button
                  key={idx}
                  variant={variant}
                  className="w-full justify-start text-left h-auto py-3 px-4"
                  onClick={() => !showResult && setSelectedAnswer(idx)}
                  disabled={showResult}
                >
                  <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
                  {opt}
                </Button>
              );
            })}
          </div>
          <div className="flex gap-2">
            {!showResult ? (
              <Button onClick={submitAnswer} disabled={selectedAnswer === null} className="w-full">Check Answer</Button>
            ) : (
              <Button onClick={nextQuestion} className="w-full">
                {currentQ + 1 >= questions.length ? "See Results" : "Next Question"}
              </Button>
            )}
          </div>
          {showResult && (
            <div className={`p-3 rounded-lg ${isCorrect ? "bg-green-500/10 text-green-700" : "bg-destructive/10 text-destructive"}`}>
              {isCorrect ? "✓ Correct!" : `✗ Wrong. Correct answer: ${question.options[question.correctAnswer]}`}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Generator */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5 text-secondary" />
            <CardTitle>AI Quiz Generator</CardTitle>
          </div>
          <CardDescription>Create practice quizzes to test your knowledge</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Topic</label>
            <Input placeholder="e.g., Cell Biology, Algebra..." value={topic} onChange={(e) => setTopic(e.target.value)} disabled={isGenerating} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Questions</label>
              <Input type="number" min={1} max={20} value={questionCount} onChange={(e) => setQuestionCount(parseInt(e.target.value) || 5)} disabled={isGenerating} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Difficulty</label>
              <Select value={difficulty} onValueChange={setDifficulty} disabled={isGenerating}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={generateQuiz} disabled={isGenerating || !topic.trim()} className="w-full" variant="gradient">
            {isGenerating ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>) : (<><Plus className="h-4 w-4 mr-2" />Generate Quiz</>)}
          </Button>
        </CardContent>
      </Card>

      {/* Quiz List */}
      {quizzes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Quizzes</CardTitle>
            <CardDescription>{quizzes.length} quizzes available</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {quizzes.map((quiz) => (
                  <div key={quiz.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium">{quiz.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {(quiz.questions as any[]).length} questions · {new Date(quiz.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => startQuiz(quiz)}>
                        <Play className="h-4 w-4 mr-1" /> Take Quiz
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteQuiz(quiz.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuizGenerator;
