import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dumbbell, GraduationCap, Heart, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

      // Get message counts for each conversation
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
      case "health":
        return <Dumbbell className="h-4 w-4" />;
      case "academic":
        return <GraduationCap className="h-4 w-4" />;
      case "wellness":
        return <Heart className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "health":
        return "bg-primary/10 text-primary";
      case "academic":
        return "bg-secondary/10 text-secondary";
      case "wellness":
        return "bg-accent/10 text-accent";
      default:
        return "bg-muted";
    }
  };

  const filterByCategory = (category: string) => {
    return conversations.filter((conv) => conv.category === category);
  };

  const getCategoryStats = (category: string) => {
    const filtered = filterByCategory(category);
    const totalMessages = filtered.reduce((sum, conv) => sum + (conv.messageCount || 0), 0);
    return {
      sessions: filtered.length,
      messages: totalMessages,
    };
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Loading your conversation history...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-elegant">
      <CardHeader>
        <CardTitle className="text-2xl">Your Conversation History</CardTitle>
        <CardDescription>Track your progress across all categories</CardDescription>
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
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Health & Fitness</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">{getCategoryStats("health").sessions}</p>
                  <p className="text-sm text-muted-foreground">{getCategoryStats("health").messages} messages</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-secondary/5 to-secondary/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-secondary" />
                    <CardTitle className="text-lg">Academic Support</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-secondary">{getCategoryStats("academic").sessions}</p>
                  <p className="text-sm text-muted-foreground">{getCategoryStats("academic").messages} messages</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-accent/5 to-accent/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-accent" />
                    <CardTitle className="text-lg">Mental Wellness</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-accent">{getCategoryStats("wellness").sessions}</p>
                  <p className="text-sm text-muted-foreground">{getCategoryStats("wellness").messages} messages</p>
                </CardContent>
              </Card>
            </div>

            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Messages</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversations.map((conv) => (
                    <TableRow key={conv.id}>
                      <TableCell>
                        <Badge className={getCategoryColor(conv.category)}>
                          <span className="flex items-center gap-1">
                            {getCategoryIcon(conv.category)}
                            {conv.category}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{conv.title}</TableCell>
                      <TableCell>{new Date(conv.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">{conv.messageCount || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="health" className="mt-6">
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Messages</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterByCategory("health").map((conv) => (
                    <TableRow key={conv.id}>
                      <TableCell className="font-medium">{conv.title}</TableCell>
                      <TableCell>{new Date(conv.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">{conv.messageCount || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="academic" className="mt-6">
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Messages</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterByCategory("academic").map((conv) => (
                    <TableRow key={conv.id}>
                      <TableCell className="font-medium">{conv.title}</TableCell>
                      <TableCell>{new Date(conv.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">{conv.messageCount || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="wellness" className="mt-6">
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Messages</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterByCategory("wellness").map((conv) => (
                    <TableRow key={conv.id}>
                      <TableCell className="font-medium">{conv.title}</TableCell>
                      <TableCell>{new Date(conv.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">{conv.messageCount || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ConversationHistory;