import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Github, Linkedin, Code2, FileText,
  CheckCircle2, ExternalLink, Edit, Sparkles, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const StudentProfilePage: React.FC = () => {
  const { user, studentProfile } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      const { data } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      setProfileData(data);
      setIsLoading(false);
    };
    fetchData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const leetcodeData = profileData?.leetcode_data || studentProfile?.extractedData?.leetcode;
  const githubData = profileData?.github_data || studentProfile?.extractedData?.github;
  const linkedinData = profileData?.linkedin_data || studentProfile?.extractedData?.linkedin;
  const aiAnalysis = profileData?.ai_analysis;
  const skills = profileData?.extracted_skills || [];
  const strength = profileData?.profile_strength || 0;

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link to="/student/dashboard">
              <Button variant="ghost" className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" /> Dashboard</Button>
            </Link>
            <h1 className="text-3xl font-bold">{studentProfile?.name || 'My Profile'}</h1>
            <p className="text-muted-foreground">{studentProfile?.institution} • {studentProfile?.degree} {studentProfile?.branch}</p>
          </div>
          <Link to="/student/profile-setup">
            <Button variant="outline"><Edit className="w-4 h-4 mr-2" /> Edit Profile</Button>
          </Link>
        </div>

        {/* Profile Strength */}
        <Card className="glass-card mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="hsl(var(--primary))" strokeWidth="3"
                    strokeDasharray={`${strength}, 100`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold">{strength}%</span>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-2">Profile Strength</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'LeetCode', connected: !!leetcodeData?.username },
                    { label: 'GitHub', connected: !!githubData?.username },
                    { label: 'LinkedIn', connected: !!linkedinData?.url },
                    { label: 'Resume', connected: !!profileData?.resume_url },
                  ].map(p => (
                    <div key={p.label} className="flex items-center gap-2 text-sm">
                      {p.connected ? <CheckCircle2 className="w-4 h-4 text-success" /> : <div className="w-4 h-4 rounded-full bg-muted" />}
                      <span className={p.connected ? '' : 'text-muted-foreground'}>{p.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Analysis */}
        {aiAnalysis?.overall_assessment && (
          <Card className="glass-card mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> AI Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{aiAnalysis.overall_assessment}</p>
              {aiAnalysis.suitable_roles && (
                <div className="flex flex-wrap gap-2">
                  {aiAnalysis.suitable_roles.map((role: string) => (
                    <Badge key={role} variant="secondary">{role}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <Card className="glass-card mb-6">
            <CardHeader><CardTitle>Extracted Skills</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill: string) => <Badge key={skill}>{skill}</Badge>)}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LeetCode */}
          {leetcodeData?.username && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-leetcode" /> LeetCode
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Problems:</span> <span className="font-semibold">{leetcodeData.problemsSolved}</span></div>
                  <div><span className="text-muted-foreground">Rating:</span> <span className="font-semibold">{leetcodeData.rating}</span></div>
                  <div><span className="text-muted-foreground">Easy:</span> <span className="font-semibold text-success">{leetcodeData.easy}</span></div>
                  <div><span className="text-muted-foreground">Medium:</span> <span className="font-semibold text-warning">{leetcodeData.medium}</span></div>
                  <div><span className="text-muted-foreground">Hard:</span> <span className="font-semibold text-destructive">{leetcodeData.hard}</span></div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* GitHub */}
          {githubData?.username && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Github className="w-5 h-5" /> GitHub
                  <a href={githubData.profileUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </a>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Repos:</span> <span className="font-semibold">{githubData.publicRepos}</span></div>
                  <div><span className="text-muted-foreground">Stars:</span> <span className="font-semibold">{githubData.totalStars}</span></div>
                  <div><span className="text-muted-foreground">Followers:</span> <span className="font-semibold">{githubData.followers}</span></div>
                </div>
                {githubData.topLanguages && (
                  <div className="flex flex-wrap gap-1">
                    {githubData.topLanguages.slice(0, 5).map((lang: string) => (
                      <Badge key={lang} variant="outline" className="text-xs">{lang}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Resume */}
        {profileData?.resume_url && (
          <Card className="glass-card mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Resume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <span>Resume uploaded and available to recruiters</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StudentProfilePage;
