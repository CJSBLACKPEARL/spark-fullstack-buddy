import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Award, BookOpen, Target } from "lucide-react";

interface ProgressStats {
  week: {
    quizzesTaken: number;
    avgScore: number;
    flashcardsCreated: number;
    studyTime: number;
  };
  month: {
    quizzesTaken: number;
    avgScore: number;
    flashcardsCreated: number;
    studyTime: number;
  };
  recentQuizzes: Array<{
    title: string;
    score: number;
    total: number;
    date: string;
  }>;
}

interface AcademicProgressProps {
  userId: string;
}

const AcademicProgress = ({ userId }: AcademicProgressProps) => {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Fetch quiz results for week
      const { data: weekQuizzes, error: weekError } = await supabase
        .from("quiz_results")
        .select("score, total_questions")
        .eq("user_id", userId)
        .gte("completed_at", weekAgo.toISOString());

      // Fetch quiz results for month
      const { data: monthQuizzes } = await supabase
        .from("quiz_results")
        .select("score, total_questions")
        .eq("user_id", userId)
        .gte("completed_at", monthAgo.toISOString());

      // Fetch flashcards for week
      const { count: weekFlashcards } = await supabase
        .from("flashcards")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", weekAgo.toISOString());

      // Fetch flashcards for month
      const { count: monthFlashcards } = await supabase
        .from("flashcards")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", monthAgo.toISOString());

      // Fetch recent quiz results with quiz details
      const { data: recentResults } = await supabase
        .from("quiz_results")
        .select("*, quizzes(title)")
        .eq("user_id", userId)
        .order("completed_at", { ascending: false })
        .limit(10);

      const weekAvgScore =
        weekQuizzes && weekQuizzes.length > 0
          ? weekQuizzes.reduce((sum, q) => sum + (q.score / q.total_questions) * 100, 0) / weekQuizzes.length
          : 0;

      const monthAvgScore =
        monthQuizzes && monthQuizzes.length > 0
          ? monthQuizzes.reduce((sum, q) => sum + (q.score / q.total_questions) * 100, 0) / monthQuizzes.length
          : 0;

      setStats({
        week: {
          quizzesTaken: weekQuizzes?.length || 0,
          avgScore: Math.round(weekAvgScore),
          flashcardsCreated: weekFlashcards || 0,
          studyTime: (weekQuizzes?.length || 0) * 15, // Estimate 15 min per quiz
        },
        month: {
          quizzesTaken: monthQuizzes?.length || 0,
          avgScore: Math.round(monthAvgScore),
          flashcardsCreated: monthFlashcards || 0,
          studyTime: (monthQuizzes?.length || 0) * 15,
        },
        recentQuizzes:
          recentResults?.map((r: any) => ({
            title: r.quizzes?.title || "Quiz",
            score: r.score,
            total: r.total_questions,
            date: new Date(r.completed_at).toLocaleDateString(),
          })) || [],
      });

      setIsLoading(false);
    };

    fetchProgress();
  }, [userId]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Loading your progress...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-elegant">
      <CardHeader>
        <CardTitle className="text-2xl">Academic Progress</CardTitle>
        <CardDescription>Track your learning journey and achievements</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="week" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
          </TabsList>

          <TabsContent value="week" className="mt-6 space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-medium">Quizzes</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">{stats?.week.quizzesTaken}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-secondary/5 to-secondary/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-secondary" />
                    <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-secondary">{stats?.week.avgScore}%</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-accent/5 to-accent/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-accent" />
                    <CardTitle className="text-sm font-medium">Flashcards</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-accent">{stats?.week.flashcardsCreated}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-primary/5 to-accent/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-medium">Study Time</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats?.week.studyTime} min</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="month" className="mt-6 space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-medium">Quizzes</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">{stats?.month.quizzesTaken}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-secondary/5 to-secondary/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-secondary" />
                    <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-secondary">{stats?.month.avgScore}%</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-accent/5 to-accent/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-accent" />
                    <CardTitle className="text-sm font-medium">Flashcards</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-accent">{stats?.month.flashcardsCreated}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-primary/5 to-accent/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-medium">Study Time</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{stats?.month.studyTime} min</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Recent Quiz Results</h3>
          <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quiz</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.recentQuizzes.map((quiz, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{quiz.title}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          (quiz.score / quiz.total) * 100 >= 80
                            ? "default"
                            : (quiz.score / quiz.total) * 100 >= 60
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {quiz.score}/{quiz.total} ({Math.round((quiz.score / quiz.total) * 100)}%)
                      </Badge>
                    </TableCell>
                    <TableCell>{quiz.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

export default AcademicProgress;