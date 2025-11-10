import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Sparkles } from "lucide-react";

interface FlashcardGeneratorProps {
  userId: string;
}

const FlashcardGenerator = ({ userId }: FlashcardGeneratorProps) => {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateFlashcards = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topic required",
        description: "Please enter a topic to generate flashcards.",
        variant: "destructive",
      });
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
    } catch (error) {
      console.error("Error generating flashcards:", error);
      toast({
        title: "Error",
        description: "Failed to generate flashcards. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
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
        <Button 
          onClick={generateFlashcards} 
          disabled={isGenerating || !topic.trim()}
          className="w-full"
          variant="gradient"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Generate Flashcards
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default FlashcardGenerator;