import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, XCircle, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ResumeUploadProps {
  onUploadComplete?: (url: string) => void;
  existingUrl?: string;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({ onUploadComplete, existingUrl }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(existingUrl || null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF or Word document');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    if (!user) {
      setError('You must be logged in to upload a resume');
      return;
    }

    setError(null);
    setIsUploading(true);
    setFileName(file.name);

    try {
      const filePath = `${user.id}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);

      // Since bucket is private, we store the path
      const resumePath = filePath;
      setUploadedUrl(resumePath);
      onUploadComplete?.(resumePath);

      toast({
        title: 'Resume uploaded!',
        description: `${file.name} has been uploaded successfully.`,
      });
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload resume');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!uploadedUrl || !user) return;

    try {
      await supabase.storage.from('resumes').remove([uploadedUrl]);
      setUploadedUrl(null);
      setFileName(null);
      toast({ title: 'Resume removed' });
    } catch (err) {
      console.error('Remove error:', err);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!uploadedUrl ? (
        <Card
          className="border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="p-8 text-center">
            {isUploading ? (
              <div className="space-y-3">
                <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Uploading {fileName}...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                <div>
                  <p className="font-medium">Upload your resume</p>
                  <p className="text-sm text-muted-foreground">PDF or Word document, max 10MB</p>
                </div>
                <Button variant="outline" size="sm" type="button">
                  Choose File
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-success/30 bg-success/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/20">
                <FileText className="w-5 h-5 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  Resume uploaded
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {fileName || 'resume.pdf'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Replace
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <XCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
};

export default ResumeUpload;
