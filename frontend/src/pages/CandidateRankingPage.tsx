import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Trophy, TrendingUp, Code, Github, Award } from 'lucide-react';
import { rankCandidates, RankedCandidate } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function CandidateRankingPage() {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { recruiterProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [ranking, setRanking] = useState<{
        job_title: string;
        total_candidates: number;
        ranked_candidates: RankedCandidate[];
    } | null>(null);

    const recruiterId = recruiterProfile?.id || '';

    const handleRank = async () => {
        if (!jobId) return;

        setLoading(true);
        try {
            const result = await rankCandidates(recruiterId, jobId);
            setRanking(result);
            toast({
                title: 'Ranking Complete',
                description: `${result.total_candidates} candidates ranked successfully`,
            });
        } catch (error: any) {
            toast({
                title: 'Ranking Failed',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-blue-600';
        if (score >= 40) return 'text-yellow-600';
        return 'text-gray-600';
    };

    const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
        if (score >= 80) return 'default';
        if (score >= 60) return 'secondary';
        return 'outline';
    };

    const getRankBadge = (rank: number) => {
        if (rank === 1) return <Badge className="bg-yellow-500">🥇 #1</Badge>;
        if (rank === 2) return <Badge className="bg-gray-400">🥈 #2</Badge>;
        if (rank === 3) return <Badge className="bg-orange-600">🥉 #3</Badge>;
        return <Badge variant="outline">#{rank}</Badge>;
    };

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">AI-Powered Candidate Ranking</h1>
                <p className="text-muted-foreground">
                    Intelligent ranking using platform scores and Gemini AI analysis
                </p>
            </div>

            {!ranking && (
                <Card>
                    <CardHeader>
                        <CardTitle>Start AI Ranking</CardTitle>
                        <CardDescription>
                            Analyze all applicants using our AI-powered ranking system
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleRank} disabled={loading} size="lg">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Analyzing Candidates...
                                </>
                            ) : (
                                <>
                                    <TrendingUp className="mr-2 h-4 w-4" />
                                    Rank Candidates with AI
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {ranking && (
                <>
                    <Card className="mb-6 border-primary">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-yellow-500" />
                                {ranking.job_title}
                            </CardTitle>
                            <CardDescription>
                                {ranking.total_candidates} candidates ranked and sorted by overall score
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    {/* Top 3 Highlights */}
                    {ranking.ranked_candidates.length >= 3 && (
                        <div className="grid md:grid-cols-3 gap-4 mb-6">
                            {ranking.ranked_candidates.slice(0, 3).map((candidate, idx) => (
                                <Card
                                    key={candidate.application_id}
                                    className={`border-2 ${idx === 0
                                        ? 'border-yellow-500 bg-yellow-50'
                                        : idx === 1
                                            ? 'border-gray-400 bg-gray-50'
                                            : 'border-orange-600 bg-orange-50'
                                        }`}
                                >
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg">{candidate.student_name}</CardTitle>
                                            {getRankBadge(candidate.rank)}
                                        </div>
                                        <CardDescription>{candidate.institution}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm">Final Score</span>
                                                <span className={`text-2xl font-bold ${getScoreColor(candidate.final_score)}`}>
                                                    {candidate.final_score}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>LeetCode</span>
                                                <Badge variant="outline">{candidate.platform_scores.leetcode}</Badge>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>GitHub</span>
                                                <Badge variant="outline">{candidate.platform_scores.github}</Badge>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>LinkedIn</span>
                                                <Badge variant="outline">{candidate.platform_scores.linkedin}</Badge>
                                            </div>
                                            {candidate.gemini_insights && (
                                                <div className="pt-2 border-t">
                                                    <p className="text-xs text-muted-foreground">
                                                        AI: {candidate.gemini_insights.hiring_confidence} Confidence
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Full Candidate List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>All Candidates</CardTitle>
                            <CardDescription>Sorted by final score (descending)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {ranking.ranked_candidates.map((candidate) => (
                                    <Card key={candidate.application_id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="pt-6">
                                            <div className="grid md:grid-cols-12 gap-4 items-center">
                                                {/* Rank & Name */}
                                                <div className="md:col-span-3">
                                                    <div className="flex items-center gap-3">
                                                        {getRankBadge(candidate.rank)}
                                                        <div>
                                                            <h3 className="font-semibold">{candidate.student_name}</h3>
                                                            <p className="text-sm text-muted-foreground">{candidate.institution}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Final Score */}
                                                <div className="md:col-span-2 text-center">
                                                    <div className={`text-3xl font-bold ${getScoreColor(candidate.final_score)}`}>
                                                        {candidate.final_score}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">Final Score</p>
                                                </div>

                                                {/* Platform Scores */}
                                                <div className="md:col-span-4">
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div className="text-center">
                                                            <Code className="h-4 w-4 mx-auto mb-1 text-orange-600" />
                                                            <Badge variant="outline" className="w-full">
                                                                {candidate.platform_scores.leetcode}
                                                            </Badge>
                                                            <p className="text-xs mt-1">LeetCode</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <Github className="h-4 w-4 mx-auto mb-1" />
                                                            <Badge variant="outline" className="w-full">
                                                                {candidate.platform_scores.github}
                                                            </Badge>
                                                            <p className="text-xs mt-1">GitHub</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <Award className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                                                            <Badge variant="outline" className="w-full">
                                                                {candidate.platform_scores.linkedin}
                                                            </Badge>
                                                            <p className="text-xs mt-1">LinkedIn</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Skills Match */}
                                                <div className="md:col-span-2">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="default" className="text-xs">
                                                                {candidate.matched_skills.length} matched
                                                            </Badge>
                                                        </div>
                                                        {candidate.missing_skills.length > 0 && (
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="destructive" className="text-xs">
                                                                    {candidate.missing_skills.length} gaps
                                                                </Badge>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Action */}
                                                <div className="md:col-span-1">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => navigate(`/recruiter/candidate/${candidate.student_id}?jobId=${jobId}`)}
                                                    >
                                                        View
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* AI Insights */}
                                            {candidate.gemini_insights && (
                                                <div className="mt-4 pt-4 border-t">
                                                    <div className="flex items-start gap-2">
                                                        <Badge variant="secondary" className="mt-1">AI Insight</Badge>
                                                        <p className="text-sm italic text-muted-foreground flex-1">
                                                            "{candidate.gemini_insights.explanation?.slice(0, 150)}..."
                                                        </p>
                                                        <Badge className={getScoreBadgeVariant(candidate.final_score)}>
                                                            {candidate.gemini_insights.hiring_confidence}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="mt-6 flex gap-4">
                        <Button variant="outline" onClick={() => navigate(-1)}>
                            Back to Applications
                        </Button>
                        <Button onClick={handleRank} disabled={loading}>
                            Re-rank Candidates
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
