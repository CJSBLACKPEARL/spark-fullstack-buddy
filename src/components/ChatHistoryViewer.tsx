import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare, Loader2 } from "lucide-react";
import MarkdownText from "./MarkdownText";

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface ChatHistoryViewerProps {
  conversationId: string;
  conversationTitle: string;
  categoryColor: string;
  onBack: () => void;
}

const ChatHistoryViewer = ({ conversationId, conversationTitle, categoryColor, onBack }: ChatHistoryViewerProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
      setIsLoading(false);
    };
    fetchMessages();
  }, [conversationId]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading messages...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-elegant">
      <CardHeader className={`bg-gradient-to-r ${categoryColor} text-primary-foreground`}>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-primary-foreground hover:bg-primary-foreground/20">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <CardTitle className="text-xl">{conversationTitle}</CardTitle>
            <p className="text-sm opacity-80 mt-0.5">{messages.length} messages</p>
          </div>
        </div>
      </CardHeader>
      <ScrollArea className="h-[500px] p-6">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No messages in this conversation</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? `bg-gradient-to-r ${categoryColor} text-primary-foreground`
                    : "bg-muted"
                }`}>
                  <div className="text-sm">
                    <MarkdownText>{msg.content}</MarkdownText>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};

export default ChatHistoryViewer;
