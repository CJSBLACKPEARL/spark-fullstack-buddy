import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Sparkles, RotateCcw, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Flashcard {
  id: string;
  title: string;
  front: string;
  back: string;
  created_at: string;
  source_type: string | null;
}

interface FlashcardGeneratorProps {
  userId: string;
}

const FlashcardGenerator = ({ userId }: FlashcardGeneratorProps) => {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [selectedSet, setSelectedSet] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const { toast } = useToast();

  const fetchFlashcards = async () => {
    const { data, error } = await supabase
      .from("flashcards")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) setFlashcards(data);
  };

  useEffect(() => {
    fetchFlashcards();
  }, [userId]);

  const generateFlashcards = async () => {
    if (!topic.trim()) {
      toast({ title: "Topic required", description: "Please enter a topic.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-flashcards", {
        body: { topic, count, userId },
      });

      if (error) throw error;

      toast({
        title: "Flashcards generated!",
        description: `Created ${data.flashcards.length} flashcards on "${topic}"`,
      });

      setTopic("");
      fetchFlashcards();
    } catch (error) {
      console.error("Error generating flashcards:", error);
      toast({ title: "Error", description: "Failed to generate flashcards.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteFlashcard = async (id: string) => {
    const { error } = await supabase.from("flashcards").delete().eq("id", id);
    if (!error) fetchFlashcards();
  };

  // Group flashcards by title
  const groupedFlashcards = flashcards.reduce((acc, fc) => {
    if (!acc[fc.title]) acc[fc.title] = [];
    acc[fc.title].push(fc);
    return acc;
  }, {} as Record<string, Flashcard[]>);

  const currentSetCards = selectedSet ? groupedFlashcards[selectedSet] || [] : [];
  const currentCard = currentSetCards[currentIndex];

  return (
    <div className="space-y-6">
      {/* Generator */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI Flashcard Generator</CardTitle>
          </div>
          <CardDescription>Generate flashcards on any topic to help you study</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Topic</label>
            <Input
              placeholder="e.g., Photosynthesis, World War 2, Python Functions..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isGenerating}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Number of Cards</label>
            <Input
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 5)}
              disabled={isGenerating}
            />
          </div>
          <Button onClick={generateFlashcards} disabled={isGenerating || !topic.trim()} className="w-full" variant="gradient">
            {isGenerating ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
            ) : (
              <><Plus className="h-4 w-4 mr-2" />Generate Flashcards</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Flashcard Viewer */}
      {selectedSet && currentCard ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{selectedSet}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => { setSelectedSet(null); setCurrentIndex(0); setIsFlipped(false); }}>
                Back to sets
              </Button>
            </div>
            <CardDescription>Card {currentIndex + 1} of {currentSetCards.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="min-h-[200px] flex items-center justify-center p-8 rounded-lg border-2 border-dashed cursor-pointer transition-all hover:border-primary bg-gradient-to-br from-background to-muted"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div className="text-center">
                <Badge variant="outline" className="mb-4">{isFlipped ? "Answer" : "Question"}</Badge>
                <p className="text-lg font-medium">{isFlipped ? currentCard.back : currentCard.front}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <Button variant="outline" size="sm" onClick={() => { setCurrentIndex(Math.max(0, currentIndex - 1)); setIsFlipped(false); }} disabled={currentIndex === 0}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsFlipped(!isFlipped)}>
                <RotateCcw className="h-4 w-4 mr-1" /> Flip
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setCurrentIndex(Math.min(currentSetCards.length - 1, currentIndex + 1)); setIsFlipped(false); }} disabled={currentIndex === currentSetCards.length - 1}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Flashcard Sets List */
        Object.keys(groupedFlashcards).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Flashcard Sets</CardTitle>
              <CardDescription>{flashcards.length} cards in {Object.keys(groupedFlashcards).length} sets</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-2">
                  {Object.entries(groupedFlashcards).map(([title, cards]) => (
                    <div key={title} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <button className="flex-1 text-left" onClick={() => { setSelectedSet(title); setCurrentIndex(0); setIsFlipped(false); }}>
                        <p className="font-medium">{title}</p>
                        <p className="text-sm text-muted-foreground">{cards.length} cards · {new Date(cards[0].created_at).toLocaleDateString()}</p>
                      </button>
                      <Button variant="ghost" size="icon" onClick={() => cards.forEach(c => deleteFlashcard(c.id))}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
};

export default FlashcardGenerator;
