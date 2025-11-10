import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";

interface DocumentUploaderProps {
  userId: string;
}

const DocumentUploader = ({ userId }: DocumentUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file type
      const allowedTypes = [
        "application/pdf",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload PDF, PPT, PPTX, DOC, or DOCX files only.",
          variant: "destructive",
        });
        return;
      }

      if (selectedFile.size > 20 * 1024 * 1024) { // 20MB limit
        toast({
          title: "File too large",
          description: "Please upload files smaller than 20MB.",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
    }
  };

  const uploadAndProcess = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      // Upload to storage
      const filePath = `${userId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("academic-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save document metadata
      const { error: dbError } = await supabase
        .from("uploaded_documents")
        .insert({
          user_id: userId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
        });

      if (dbError) throw dbError;

      toast({
        title: "Upload successful!",
        description: "Processing document to generate study materials...",
      });

      setIsUploading(false);
      setIsProcessing(true);

      // Process document to generate flashcards and quiz
      const { error: processError } = await supabase.functions.invoke("process-document", {
        body: { filePath, userId, fileName: file.name },
      });

      if (processError) throw processError;

      toast({
        title: "Processing complete!",
        description: "Flashcards and quiz have been generated from your document.",
      });

      setFile(null);
      setIsProcessing(false);
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Error",
        description: "Failed to process document. Please try again.",
        variant: "destructive",
      });
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-accent" />
          <CardTitle>Upload Study Materials</CardTitle>
        </div>
        <CardDescription>
          Upload PPTs, PDFs, or Word documents to generate flashcards and quizzes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            type="file"
            accept=".pdf,.ppt,.pptx,.doc,.docx"
            onChange={handleFileChange}
            disabled={isUploading || isProcessing}
          />
          {file && (
            <p className="text-sm text-muted-foreground mt-2">
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>
        <Button
          onClick={uploadAndProcess}
          disabled={!file || isUploading || isProcessing}
          className="w-full"
          variant="gradient"
        >
          {isUploading || isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isUploading ? "Uploading..." : "Processing..."}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload & Generate Materials
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DocumentUploader;