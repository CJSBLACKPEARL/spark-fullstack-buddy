import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import MarkdownText from "@/components/MarkdownText";
import { useToast } from "@/hooks/use-toast";

interface StudyNotesProps {
  userId: string;
}

const StudyNotes = ({ userId }: StudyNotesProps) => {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchNotes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("study_notes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notes:", error);
    } else {
      setNotes(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotes();
  }, [userId]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("study_notes").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete note.", variant: "destructive" });
    } else {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast({ title: "Deleted", description: "Note removed." });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>No study notes yet. Upload a document to generate notes automatically.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <Card key={note.id} className="overflow-hidden">
          <CardHeader
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setExpandedId(expandedId === note.id ? null : note.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent" />
                <CardTitle className="text-base">{note.title}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {new Date(note.created_at).toLocaleDateString()}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          </CardHeader>
          {expandedId === note.id && (
            <CardContent className="border-t pt-4">
              <MarkdownText content={note.content} />
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};

export default StudyNotes;
