import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, AlertTriangle, XCircle, TrendingUp, Lightbulb, Target } from 'lucide-react';
import { checkEligibility, EligibilityResult } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function EligibilityCheckPage() {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<EligibilityResult | null>(null);

    // Get student ID from auth context (placeholder)
    const studentId = '00000000-0000-0000-0000-000000000002';

    const handleCheck = async () => {
        if (!jobId) return;

        setLoading(true);
        try {
            const eligibility = await checkEligibility(studentId, jobId);
            setResult(eligibility);
        } catch (error: any) {
            toast({
                title: 'Check Failed',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const getDecisionConfig = (decision: string) => {
        switch (decision) {
            case 'APPLY':
                return {
                    icon: <CheckCircle2 className="h-8 w-8 text-green-600" />,
                    color: 'bg-green-50 border-green-200',
                    badgeClass: 'bg-green-600',
                    title: 'You\'re Ready!',
                };
            case 'IMPROVE':
                return {
                    icon: <TrendingUp className="h-8 w-8 text-blue-600" />,
                    color: 'bg-blue-50 border-blue-200',
                    badgeClass: 'bg-blue-600',
                    title: 'Almost There!',
                };
            default:
                return {
                    icon: <AlertTriangle className="h-8 w-8 text-orange-600" />,
                    color: 'bg-orange-50 border-orange-200',
                    badgeClass: 'bg-orange-600',
                    title: 'Build Skills First',
                };
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-5xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Can I Apply?</h1>
                <p className="text-muted-foreground">
                    AI-powered eligibility check with personalized recommendations
                </p>
            </div>

            {!result && (
                <Card>
                    <CardHeader>
                        <CardTitle>Check Your Eligibility</CardTitle>
                        <CardDescription>
                            Get instant AI analysis of your fit for this role
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleCheck} disabled={loading} size="lg">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Analyzing Your Profile...
                                </>
                            ) : (
                                <>
                                    <Target className="mr-2 h-4 w-4" />
                                    Check Eligibility
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {result && (
                <div className="space-y-6">
                    {/* Decision Card */}
                    <Card className={`border-2 ${getDecisionConfig(result.decision).color}`}>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                {getDecisionConfig(result.decision).icon}
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold mb-1">
                                        {getDecisionConfig(result.decision).title}
                                    </h2>
                                    <p className="text-lg text-muted-foreground">{result.decision_message}</p>
                                </div>
                                <Badge className={`${getDecisionConfig(result.decision).badgeClass} text-white text-lg px-4 py-2`}>
                                    {result.fit_percentage}% Fit
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Fit Percentage Visualization */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Fit Score</CardTitle>
                            <CardDescription>Based on skills, experience, and profile analysis</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Progress value={result.fit_percentage} className="h-4" />
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Not Ready</span>
                                    <span className="font-semibold text-foreground">{result.fit_percentage}%</span>
                                    <span>Perfect Match</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Strengths */}
                    {result.strengths && result.strengths.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    Your Strengths
                                </CardTitle>
                                <CardDescription>What makes you a good fit</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {result.strengths.map((strength, idx) => (
                                        <div key={idx} className="border-l-4 border-green-600 pl-4 py-2">
                                            <div className="flex items-start gap-2">
                                                <Badge variant="outline" className="mt-1">
                                                    {strength.category}
                                                </Badge>
                                                <div className="flex-1">
                                                    <p className="font-medium">{strength.detail}</p>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Impact: {strength.impact}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Skill Gaps */}
                    {result.skill_gaps && result.skill_gaps.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <XCircle className="h-5 w-5 text-red-600" />
                                    Skill Gaps
                                </CardTitle>
                                <CardDescription>Areas to improve before applying</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {result.skill_gaps.map((gap, idx) => (
                                        <div key={idx} className="border-l-4 border-red-600 pl-4 py-2">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold">{gap.skill}</span>
                                                        <Badge variant={gap.importance === 'CRITICAL' ? 'destructive' : 'secondary'}>
                                                            {gap.importance}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex gap-4 text-sm text-muted-foreground">
                                                        <span>Current: {gap.current_level}</span>
                                                        <span>→</span>
                                                        <span>Required: {gap.required_level}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* AI Recommendation */}
                    <Card className="border-primary">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lightbulb className="h-5 w-5 text-yellow-600" />
                                AI Recommendation
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg leading-relaxed">{result.ai_recommendation}</p>
                        </CardContent>
                    </Card>

                    {/* Action Items */}
                    {result.action_items && result.action_items.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Your Action Plan</CardTitle>
                                <CardDescription>Prioritized steps to improve your profile</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {result.action_items.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 p-3 border rounded-lg hover:bg-accent transition-colors">
                                            <div className="flex-shrink-0">
                                                <Badge variant={item.priority === 'HIGH' ? 'destructive' : 'secondary'}>
                                                    {item.priority}
                                                </Badge>
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-medium mb-1">{item.action}</h4>
                                                <p className="text-sm text-muted-foreground mb-2">{item.reason}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    ⏱️ Estimated time: {item.estimated_time}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4">
                        <Button variant="outline" onClick={() => navigate(-1)}>
                            Back to Job
                        </Button>
                        {result.decision === 'APPLY' && (
                            <Button onClick={() => navigate(`/student/jobs/${jobId}/apply`)}>
                                Apply Now
                            </Button>
                        )}
                        {result.decision !== 'APPLY' && (
                            <Button onClick={() => navigate(`/student/jobs/${jobId}/roadmap`)}>
                                Get Learning Roadmap
                            </Button>
                        )}
                        <Button variant="outline" onClick={handleCheck} disabled={loading}>
                            Re-check
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
