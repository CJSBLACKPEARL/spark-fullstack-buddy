import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dumbbell, GraduationCap, Heart, MessageSquare, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ChatHistoryViewer from "./ChatHistoryViewer";

interface Conversation {
  id: string;
  title: string;
  category: string;
  created_at: string;
  messageCount?: number;
}

interface ConversationHistoryProps {
  userId: string;
}

const ConversationHistory = ({ userId }: ConversationHistoryProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      const { data: convData, error: convError } = await supabase
        .from("chat_conversations")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (convError) {
        console.error("Error fetching conversations:", convError);
        setIsLoading(false);
        return;
      }

      const conversationsWithCounts = await Promise.all(
        (convData || []).map(async (conv) => {
          const { count } = await supabase
            .from("chat_messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id);
          return { ...conv, messageCount: count || 0 };
        })
      );

      setConversations(conversationsWithCounts);
      setIsLoading(false);
    };

    fetchConversations();
  }, [userId]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "health": return <Dumbbell className="h-4 w-4" />;
      case "academic": return <GraduationCap className="h-4 w-4" />;
      case "wellness": return <Heart className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "health": return "bg-primary/10 text-primary";
      case "academic": return "bg-secondary/10 text-secondary";
      case "wellness": return "bg-accent/10 text-accent";
      default: return "bg-muted";
    }
  };

  const getCategoryGradient = (category: string) => {
    switch (category) {
      case "health": return "from-primary to-primary-glow";
      case "academic": return "from-secondary to-accent";
      case "wellness": return "from-accent to-primary";
      default: return "from-primary to-secondary";
    }
  };

  const filterByCategory = (category: string) => conversations.filter((c) => c.category === category);

  const getCategoryStats = (category: string) => {
    const filtered = filterByCategory(category);
    return {
      sessions: filtered.length,
      messages: filtered.reduce((sum, c) => sum + (c.messageCount || 0), 0),
    };
  };

  if (selectedConversation) {
    return (
      <ChatHistoryViewer
        conversationId={selectedConversation.id}
        conversationTitle={selectedConversation.title || "Untitled"}
        categoryColor={getCategoryGradient(selectedConversation.category)}
        onBack={() => setSelectedConversation(null)}
      />
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Loading your conversation history...
        </CardContent>
      </Card>
    );
  }

  const renderConversationRow = (conv: Conversation, showCategory = false) => (
    <TableRow key={conv.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedConversation(conv)}>
      {showCategory && (
        <TableCell>
          <Badge className={getCategoryColor(conv.category)}>
            <span className="flex items-center gap-1">
              {getCategoryIcon(conv.category)}
              {conv.category}
            </span>
          </Badge>
        </TableCell>
      )}
      <TableCell className="font-medium">{conv.title}</TableCell>
      <TableCell>{new Date(conv.created_at).toLocaleDateString()}</TableCell>
      <TableCell className="text-right">{conv.messageCount || 0}</TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="sm" className="text-primary">
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );

  return (
    <Card className="shadow-elegant">
      <CardHeader>
        <CardTitle className="text-2xl">Your Conversation History</CardTitle>
        <CardDescription>Click any session to view the full conversation</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="health">Health</TabsTrigger>
            <TabsTrigger value="academic">Academic</TabsTrigger>
            <TabsTrigger value="wellness">Wellness</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {[
                { cat: "health", icon: Dumbbell, label: "Health & Fitness", color: "primary" },
                { cat: "academic", icon: GraduationCap, label: "Academic Support", color: "secondary" },
                { cat: "wellness", icon: Heart, label: "Mental Wellness", color: "accent" },
              ].map(({ cat, icon: Icon, label, color }) => (
                <Card key={cat} className={`bg-gradient-to-br from-${color}/5 to-${color}/10`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 text-${color}`} />
                      <CardTitle className="text-lg">{label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-2xl font-bold text-${color}`}>{getCategoryStats(cat).sessions}</p>
                    <p className="text-sm text-muted-foreground">{getCategoryStats(cat).messages} messages</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Messages</TableHead>
                    <TableHead className="text-right">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversations.map((conv) => renderConversationRow(conv, true))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>

          {["health", "academic", "wellness"].map((cat) => (
            <TabsContent key={cat} value={cat} className="mt-6">
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Messages</TableHead>
                      <TableHead className="text-right">View</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterByCategory(cat).map((conv) => renderConversationRow(conv))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ConversationHistory;
