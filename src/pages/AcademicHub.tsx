import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import FlashcardGenerator from "@/components/academic/FlashcardGenerator";
import QuizGenerator from "@/components/academic/QuizGenerator";
import DocumentUploader from "@/components/academic/DocumentUploader";
import AcademicProgress from "@/components/academic/AcademicProgress";
import ChatInterface from "@/components/ChatInterface";

interface AcademicHubProps {
  user: User;
  onBack: () => void;
}

const AcademicHub = ({ user, onBack }: AcademicHubProps) => {
  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Categories
      </Button>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="chat">AI Chat</TabsTrigger>
          <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-6">
          <ChatInterface category="academic" userId={user.id} />
        </TabsContent>

        <TabsContent value="flashcards" className="mt-6">
          <FlashcardGenerator userId={user.id} />
        </TabsContent>

        <TabsContent value="quizzes" className="mt-6">
          <QuizGenerator userId={user.id} />
        </TabsContent>

        <TabsContent value="upload" className="mt-6">
          <DocumentUploader userId={user.id} />
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          <AcademicProgress userId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AcademicHub;