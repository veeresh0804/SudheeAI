import React, { useState, useEffect } from 'react';
import { Loader2, Brain, Dna, Rocket, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { intelligenceService } from '@/services/intelligenceService';
import { supabase } from '@/integrations/supabase/client';
import IntelligenceScoreCard from '@/components/intelligence/IntelligenceScoreCard';
import CodingDnaCard from '@/components/intelligence/CodingDnaCard';
import TrajectoryCard from '@/components/intelligence/TrajectoryCard';
import { useToast } from '@/hooks/use-toast';

const StudentIntelligencePage: React.FC = () => {
  const { user, studentProfile } = useAuth();
  const { flags, isLoading: flagsLoading } = useFeatureFlags();
  const { toast } = useToast();

  const [dnaAnalysis, setDnaAnalysis] = useState<any>(null);
  const [trajectory, setTrajectory] = useState<any>(null);
  const [isLoadingDna, setIsLoadingDna] = useState(false);
  const [isLoadingTrajectory, setIsLoadingTrajectory] = useState(false);
  const [existingDna, setExistingDna] = useState<any>(null);
  const [existingTrajectory, setExistingTrajectory] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    // Load existing analyses
    const load = async () => {
      const { data: dna } = await supabase
        .from('coding_dna_analyses')
        .select('*')
        .eq('student_id', user.id)
        .maybeSingle();
      if (dna) setExistingDna(dna);

      const { data: traj } = await supabase
        .from('talent_trajectory_predictions')
        .select('*')
        .eq('student_id', user.id)
        .maybeSingle();
      if (traj) setExistingTrajectory(traj);
    };
    load();
  }, [user]);

  const runDnaAnalysis = async () => {
    if (!studentProfile?.extractedData?.github) {
      toast({ title: 'GitHub data required', description: 'Please connect your GitHub profile first.', variant: 'destructive' });
      return;
    }
    setIsLoadingDna(true);
    try {
      const result = await intelligenceService.analyzeCodingDna({
        studentId: user?.id,
        githubData: studentProfile.extractedData.github,
      });
      setDnaAnalysis(result.analysis);
      setExistingDna(result.analysis);
      toast({ title: 'DNA Analysis Complete' });
    } catch (err: any) {
      toast({ title: 'Analysis failed', description: err.message, variant: 'destructive' });
    }
    setIsLoadingDna(false);
  };

  const runTrajectory = async () => {
    setIsLoadingTrajectory(true);
    try {
      const result = await intelligenceService.predictTrajectory({
        studentId: user?.id,
        profileSnapshot: {
          skills: studentProfile?.extractedData,
          institution: studentProfile?.institution,
          degree: studentProfile?.degree,
        },
      });
      setTrajectory(result.prediction);
      setExistingTrajectory(result.prediction);
      toast({ title: 'Trajectory Predicted' });
    } catch (err: any) {
      toast({ title: 'Prediction failed', description: err.message, variant: 'destructive' });
    }
    setIsLoadingTrajectory(false);
  };

  if (flagsLoading) {
    return <div className="min-h-screen pt-20 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const noFeaturesEnabled = !flags.ENABLE_CODING_DNA && !flags.ENABLE_TRAJECTORY && !flags.ENABLE_COMPOSITE_SCORE;

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="w-8 h-8 text-primary" /> Intelligence Hub
          </h1>
          <p className="text-muted-foreground mt-1">AI-powered insights about your profile and career trajectory</p>
        </div>

        {noFeaturesEnabled ? (
          <Card className="glass-card">
            <CardContent className="p-12 text-center">
              <Brain className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Intelligence Features Coming Soon</h2>
              <p className="text-muted-foreground">Advanced AI-powered analysis features are being rolled out gradually. Check back soon!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {flags.ENABLE_CODING_DNA && (
              <div className="space-y-4">
                {existingDna ? (
                  <CodingDnaCard analysis={existingDna} />
                ) : (
                  <Card className="glass-card">
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Dna className="w-5 h-5" /> Coding DNA</CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">Analyze your coding patterns, architecture skills, and code maturity from your GitHub profile.</p>
                      <Button onClick={runDnaAnalysis} disabled={isLoadingDna} className="w-full">
                        {isLoadingDna ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Dna className="w-4 h-4 mr-2" />}
                        Run DNA Analysis
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {flags.ENABLE_TRAJECTORY && (
              <div className="space-y-4">
                {existingTrajectory ? (
                  <TrajectoryCard prediction={existingTrajectory} />
                ) : (
                  <Card className="glass-card">
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Rocket className="w-5 h-5" /> Career Trajectory</CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">Predict your career path based on your skills, growth patterns, and industry trends.</p>
                      <Button onClick={runTrajectory} disabled={isLoadingTrajectory} className="w-full">
                        {isLoadingTrajectory ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Rocket className="w-4 h-4 mr-2" />}
                        Predict Trajectory
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentIntelligencePage;
