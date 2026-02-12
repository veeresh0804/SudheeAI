import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, FileText } from 'lucide-react';

interface JDInputFormProps {
  onAnalyze: (jdText: string) => void;
  isLoading?: boolean;
}

const JDInputForm: React.FC<JDInputFormProps> = ({ onAnalyze, isLoading = false }) => {
  const [jdText, setJdText] = useState('');
  const maxChars = 5000;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (jdText.trim()) {
      onAnalyze(jdText);
    }
  };

  const charCount = jdText.length;
  const charPercentage = (charCount / maxChars) * 100;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <div className="absolute top-3 left-3">
          <FileText className="w-5 h-5 text-muted-foreground" />
        </div>
        <textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value.slice(0, maxChars))}
          placeholder="Paste the complete job description here...

Example:
We are looking for an AI Engineer with strong Python skills, experience in Machine Learning and TensorFlow. Must have solid understanding of Data Structures and Algorithms..."
          className="textarea-field min-h-[250px] pl-10 pt-3"
          disabled={isLoading}
        />
        
        {/* Character counter */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                charPercentage > 90 ? 'bg-destructive' : 
                charPercentage > 70 ? 'bg-warning' : 'bg-primary'
              }`}
              style={{ width: `${charPercentage}%` }}
            />
          </div>
          <span className={`text-xs ${charPercentage > 90 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {charCount.toLocaleString()}/{maxChars.toLocaleString()}
          </span>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!jdText.trim() || isLoading}
        className="btn-primary w-full sm:w-auto"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Analyze JD
          </>
        )}
      </Button>
    </form>
  );
};

export default JDInputForm;
