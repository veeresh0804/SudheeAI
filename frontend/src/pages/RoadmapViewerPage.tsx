import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, BookOpen, Code, Trophy, Calendar, Target, Lightbulb, AlertTriangle } from 'lucide-react';
import { generateRoadmap, SkillGapRoadmap } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function RoadmapViewerPage() {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { studentProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [roadmap, setRoadmap] = useState<SkillGapRoadmap | null>(null);

    const studentId = studentProfile?.id || '';

    const handleGenerate = async () => {
        if (!jobId) return;

        setLoading(true);
        try {
            const result = await generateRoadmap(studentId, jobId);
            setRoadmap(result);
            toast({
                title: 'Roadmap Generated',
                description: `Your ${result.expected_outcome.duration_weeks}-week learning plan is ready!`,
            });
        } catch (error: any) {
            toast({
                title: 'Generation Failed',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Learning Roadmap</h1>
                <p className="text-muted-foreground">
                    AI-generated personalized learning path to bridge your skill gaps
                </p>
            </div>

            {!roadmap && (
                <Card>
                    <CardHeader>
                        <CardTitle>Generate Your Roadmap</CardTitle>
                        <CardDescription>
                            Get a comprehensive learning plan with resources, projects, and timelines
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={handleGenerate} disabled={loading} size="lg">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating Roadmap...
                                </>
                            ) : (
                                <>
                                    <BookOpen className="mr-2 h-4 w-4" />
                                    Generate Learning Roadmap
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {roadmap && (
                <div className="space-y-6">
                    {/* Progress Summary */}
                    <Card className="border-primary">
                        <CardHeader>
                            <CardTitle>Your Journey</CardTitle>
                            <CardDescription>From {roadmap.current_fit}% to {roadmap.target_fit}% fit</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm">Current Fit</span>
                                        <span className="text-sm font-medium">{roadmap.current_fit}%</span>
                                    </div>
                                    <Progress value={roadmap.current_fit} className="h-2" />
                                </div>
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm">Target Fit</span>
                                        <span className="text-sm font-medium">{roadmap.target_fit}%</span>
                                    </div>
                                    <Progress value={roadmap.target_fit} className="h-2" />
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-primary">{roadmap.expected_outcome.duration_weeks}</div>
                                        <div className="text-xs text-muted-foreground">Weeks</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-primary">{roadmap.expected_outcome.improvement_percentage}</div>
                                        <div className="text-xs text-muted-foreground">% Improvement</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-primary">{roadmap.expected_outcome.projects_count}</div>
                                        <div className="text-xs text-muted-foreground">Projects</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-primary">{roadmap.expected_outcome.hours_per_week}</div>
                                        <div className="text-xs text-muted-foreground">Hrs/Week</div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Badge variant="outline" className="text-sm">
                                        Expected Outcome: {roadmap.expected_outcome.expected_role_readiness}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabs for different sections */}
                    <Tabs defaultValue="phases" className="w-full">
                        <TabsList className="grid w-full grid-cols-5">
                            <TabsTrigger value="phases">Phases</TabsTrigger>
                            <TabsTrigger value="skills">Skills</TabsTrigger>
                            <TabsTrigger value="projects">Projects</TabsTrigger>
                            <TabsTrigger value="schedule">Schedule</TabsTrigger>
                            <TabsTrigger value="tips">Tips</TabsTrigger>
                        </TabsList>

                        {/* Learning Phases */}
                        <TabsContent value="phases" className="space-y-4">
                            {roadmap.roadmap.learning_phases?.map((phase: any, idx: number) => (
                                <Card key={idx}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Badge>{phase.phase_number}</Badge>
                                                    {phase.phase_name}
                                                </CardTitle>
                                                <CardDescription>Duration: {phase.duration_weeks} weeks</CardDescription>
                                            </div>
                                            <Calendar className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold mb-2">Focus Areas</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {phase.focus_areas?.map((area: string, i: number) => (
                                                    <Badge key={i} variant="secondary">{area}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-2">Objectives</h4>
                                            <ul className="space-y-1">
                                                {phase.objectives?.map((obj: string, i: number) => (
                                                    <li key={i} className="text-sm flex items-start gap-2">
                                                        <Target className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                                                        {obj}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        {phase.milestones && phase.milestones.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold mb-2">Milestones</h4>
                                                <div className="space-y-2">
                                                    {phase.milestones.map((milestone: any, i: number) => (
                                                        <div key={i} className="border-l-2 border-primary pl-3">
                                                            <p className="text-sm font-medium">{milestone.milestone}</p>
                                                            <p className="text-xs text-muted-foreground">✓ {milestone.verification}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </TabsContent>

                        {/* Skill Deep Dives */}
                        <TabsContent value="skills" className="space-y-4">
                            {roadmap.skill_gaps?.map((gap, idx: number) => (
                                <Card key={idx}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="flex items-center gap-2">
                                                    {gap.skill}
                                                    <Badge variant={gap.importance === 'CRITICAL' ? 'destructive' : 'secondary'}>
                                                        {gap.importance}
                                                    </Badge>
                                                </CardTitle>
                                                <CardDescription>
                                                    {gap.current_level} → {gap.target_level} ({gap.estimated_hours} hours)
                                                </CardDescription>
                                            </div>
                                            <Code className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {roadmap.roadmap.skill_deep_dives?.find((dive: any) => dive.skill === gap.skill)?.learning_path?.map((step: any, i: number) => (
                                            <div key={i} className="mb-4 last:mb-0">
                                                <div className="flex items-start gap-3">
                                                    <Badge variant="outline" className="mt-1">Step {step.step}</Badge>
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold mb-1">{step.topic}</h4>
                                                        <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                                                        <p className="text-xs text-muted-foreground mb-2">⏱️ {step.estimated_hours} hours</p>

                                                        {step.resources && step.resources.length > 0 && (
                                                            <div className="mt-2">
                                                                <p className="text-xs font-semibold mb-1">Resources:</p>
                                                                <div className="space-y-1">
                                                                    {step.resources.map((resource: any, j: number) => (
                                                                        <div key={j} className="flex items-center gap-2 text-xs">
                                                                            <Badge variant="outline" className="text-xs">{resource.type}</Badge>
                                                                            <span className="flex-1">{resource.name}</span>
                                                                            <Badge className="text-xs">{resource.difficulty}</Badge>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            ))}
                        </TabsContent>

                        {/* Projects */}
                        <TabsContent value="projects" className="space-y-4">
                            {roadmap.roadmap.hands_on_projects?.map((project: any, idx: number) => (
                                <Card key={idx}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle>{project.project_name}</CardTitle>
                                                <CardDescription>
                                                    {project.estimated_time_weeks} weeks • {project.complexity}
                                                </CardDescription>
                                            </div>
                                            <Trophy className="h-6 w-6 text-yellow-600" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <p className="text-sm">{project.description}</p>
                                        <div>
                                            <h4 className="text-sm font-semibold mb-2">Skills Covered</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {project.skills_covered?.map((skill: string, i: number) => (
                                                    <Badge key={i} variant="secondary">{skill}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold mb-2">Deliverables</h4>
                                            <ul className="text-sm space-y-1">
                                                {project.deliverables?.map((item: string, i: number) => (
                                                    <li key={i} className="flex items-start gap-2">
                                                        <span className="text-primary">✓</span> {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </TabsContent>

                        {/* Weekly Schedule */}
                        <TabsContent value="schedule">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Weekly Schedule</CardTitle>
                                    <CardDescription>
                                        {roadmap.roadmap.weekly_schedule?.hours_per_week} hours per week breakdown
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {Object.entries(roadmap.roadmap.weekly_schedule?.time_breakdown || {}).map(([key, value]: [string, any]) => (
                                            <div key={key} className="text-center p-3 border rounded-lg">
                                                <div className="text-2xl font-bold text-primary">{value}</div>
                                                <div className="text-xs text-muted-foreground capitalize">{key.replace('_', ' ')}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {roadmap.roadmap.coding_practice && (
                                        <div className="mt-6">
                                            <h4 className="font-semibold mb-3">Coding Practice Strategy</h4>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle className="text-base">LeetCode</CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="text-sm space-y-2">
                                                        <p><strong>{roadmap.roadmap.coding_practice.leetcode_strategy?.problems_per_week}</strong> problems/week</p>
                                                        <div className="flex gap-2">
                                                            <Badge variant="outline">
                                                                Easy: {roadmap.roadmap.coding_practice.leetcode_strategy?.difficulty_split?.easy}
                                                            </Badge>
                                                            <Badge variant="outline">
                                                                Med: {roadmap.roadmap.coding_practice.leetcode_strategy?.difficulty_split?.medium}
                                                            </Badge>
                                                            <Badge variant="outline">
                                                                Hard: {roadmap.roadmap.coding_practice.leetcode_strategy?.difficulty_split?.hard}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs">Target: {roadmap.roadmap.coding_practice.leetcode_strategy?.target_total} total</p>
                                                    </CardContent>
                                                </Card>
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle className="text-base">GitHub</CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="text-sm space-y-2">
                                                        <p><strong>{roadmap.roadmap.coding_practice.github_strategy?.commit_frequency}</strong></p>
                                                        <div className="space-y-1">
                                                            {roadmap.roadmap.coding_practice.github_strategy?.project_types?.map((type: string, i: number) => (
                                                                <Badge key={i} variant="outline" className="mr-2">{type}</Badge>
                                                            ))}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Tips & Pitfalls */}
                        <TabsContent value="tips" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Lightbulb className="h-5 w-5 text-yellow-600" />
                                        Motivation Tips
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {roadmap.roadmap.motivation_tips?.map((tip: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm">
                                                <span className="text-yellow-600">💡</span> {tip}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                                        Common Pitfalls
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {roadmap.roadmap.common_pitfalls?.map((pitfall: any, idx: number) => (
                                            <div key={idx} className="border-l-4 border-orange-600 pl-3">
                                                <p className="font-medium text-sm">{pitfall.pitfall}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    How to avoid: {pitfall.how_to_avoid}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {roadmap.roadmap.final_recommendation && (
                                <Card className="border-primary">
                                    <CardHeader>
                                        <CardTitle>Final Recommendation</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="leading-relaxed">{roadmap.roadmap.final_recommendation}</p>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>
                    </Tabs>

                    <div className="flex gap-4">
                        <Button variant="outline" onClick={() => navigate(-1)}>
                            Back
                        </Button>
                        <Button onClick={() => navigate(`/student/jobs/${jobId}`)}>
                            View Job Details
                        </Button>
                        <Button variant="outline" onClick={handleGenerate} disabled={loading}>
                            Regenerate
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
