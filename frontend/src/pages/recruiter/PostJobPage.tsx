import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Briefcase, 
  FileText, 
  Target, 
  Info, 
  Check,
  Sparkles,
  X,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { analyzeJobDescription } from '@/services/nlpProcessor';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import LoadingSpinner from '@/components/LoadingSpinner';

const PostJobPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, recruiterProfile } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    jobType: '',
    experienceRequired: '',
    description: '',
    requiredSkills: [] as string[],
    preferredSkills: [] as string[],
    salaryRange: '',
    deadline: '',
    numberOfOpenings: '1',
    companyDescription: '',
    roleType: 'SDE' as string,
  });
  
  const [newSkill, setNewSkill] = useState('');
  const [skillType, setSkillType] = useState<'required' | 'preferred'>('required');

  const steps = [
    { num: 1, label: 'Basic Details', icon: Briefcase },
    { num: 2, label: 'Job Description', icon: FileText },
    { num: 3, label: 'Required Skills', icon: Target },
    { num: 4, label: 'Additional Info', icon: Info },
    { num: 5, label: 'Review & Post', icon: Check },
  ];

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const extractSkills = async () => {
    if (!formData.description.trim()) {
      toast({ title: 'No description', description: 'Please enter a job description first.', variant: 'destructive' });
      return;
    }
    setIsExtracting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const analyzed = analyzeJobDescription(formData.description);
    updateField('requiredSkills', analyzed.skills.mandatory);
    updateField('preferredSkills', analyzed.skills.optional);
    updateField('roleType', analyzed.roleType);
    setIsExtracting(false);
    toast({ title: 'Skills extracted!', description: `Found ${analyzed.totalSkills} skills from the job description.` });
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    if (skillType === 'required') {
      if (!formData.requiredSkills.includes(newSkill)) updateField('requiredSkills', [...formData.requiredSkills, newSkill]);
    } else {
      if (!formData.preferredSkills.includes(newSkill)) updateField('preferredSkills', [...formData.preferredSkills, newSkill]);
    }
    setNewSkill('');
  };

  const removeSkill = (skill: string, type: 'required' | 'preferred') => {
    if (type === 'required') updateField('requiredSkills', formData.requiredSkills.filter(s => s !== skill));
    else updateField('preferredSkills', formData.preferredSkills.filter(s => s !== skill));
  };

  const handlePost = async () => {
    if (!user) {
      toast({ title: 'Not authenticated', description: 'Please log in to post a job.', variant: 'destructive' });
      return;
    }

    setIsPosting(true);
    try {
      const { error } = await supabase.from('jobs').insert({
        recruiter_id: user.id,
        title: formData.title,
        company_name: recruiterProfile?.companyName || 'Company',
        description: formData.description,
        location: formData.location,
        job_type: formData.jobType,
        experience_required: formData.experienceRequired,
        required_skills: formData.requiredSkills,
        preferred_skills: formData.preferredSkills,
        role_type: formData.roleType,
        salary_range: formData.salaryRange || null,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
        status: 'active',
      });

      if (error) throw error;

      toast({ title: 'Job posted successfully!', description: 'Your job is now live and candidates can start applying.' });
      navigate('/recruiter/dashboard');
    } catch (err: any) {
      console.error('Post job error:', err);
      toast({ title: 'Error posting job', description: err.message, variant: 'destructive' });
    } finally {
      setIsPosting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.title && formData.location && formData.jobType && formData.experienceRequired;
      case 2: return formData.description.length >= 100;
      case 3: return formData.requiredSkills.length >= 2;
      case 4: return true;
      default: return true;
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/recruiter/dashboard')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Post a New Job</h1>
          <p className="text-muted-foreground mt-1">Create a job posting and start receiving AI-ranked applications</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
          {steps.map((step, index) => (
            <React.Fragment key={step.num}>
              <div className={`flex items-center gap-2 flex-shrink-0 cursor-pointer ${currentStep >= step.num ? 'text-primary' : 'text-muted-foreground'}`}
                onClick={() => step.num < currentStep && setCurrentStep(step.num)}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                  ${currentStep > step.num ? 'bg-primary text-white' : currentStep === step.num ? 'bg-primary/20 text-primary border-2 border-primary' : 'bg-muted text-muted-foreground'}`}>
                  {currentStep > step.num ? <Check className="w-4 h-4" /> : step.num}
                </div>
                <span className="hidden md:inline text-sm font-medium">{step.label}</span>
              </div>
              {index < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${currentStep > step.num ? 'bg-primary' : 'bg-muted'}`} />}
            </React.Fragment>
          ))}
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(steps[currentStep - 1].icon, { className: 'w-5 h-5' })}
              {steps[currentStep - 1].label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Basic Details */}
            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input id="title" placeholder="e.g., AI Engineer Intern" value={formData.title} onChange={(e) => updateField('title', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input id="department" placeholder="e.g., Engineering" value={formData.department} onChange={(e) => updateField('department', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Select value={formData.location} onValueChange={(v) => updateField('location', v)}>
                      <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Remote">Remote</SelectItem>
                        <SelectItem value="Hybrid">Hybrid</SelectItem>
                        <SelectItem value="On-site">On-site</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="jobType">Job Type *</Label>
                    <Select value={formData.jobType} onValueChange={(v) => updateField('jobType', v)}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Intern">Intern</SelectItem>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience">Experience Required *</Label>
                    <Select value={formData.experienceRequired} onValueChange={(v) => updateField('experienceRequired', v)}>
                      <SelectTrigger><SelectValue placeholder="Select experience" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-1 years">0-1 years</SelectItem>
                        <SelectItem value="1-3 years">1-3 years</SelectItem>
                        <SelectItem value="3-5 years">3-5 years</SelectItem>
                        <SelectItem value="5+ years">5+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Role Type *</Label>
                  <Select value={formData.roleType} onValueChange={(v) => updateField('roleType', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AI">AI Engineer</SelectItem>
                      <SelectItem value="SDE">SDE</SelectItem>
                      <SelectItem value="Full-Stack">Full-Stack</SelectItem>
                      <SelectItem value="Data Analyst">Data Analyst</SelectItem>
                      <SelectItem value="ML Engineer">ML Engineer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Step 2: Job Description */}
            {currentStep === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="description">Job Description *</Label>
                  <Textarea id="description" placeholder="Enter the complete job description..." value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)} className="min-h-[300px]" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formData.description.length} characters</span>
                    <span>Minimum 100 characters required</span>
                  </div>
                </div>
                <Button onClick={extractSkills} disabled={isExtracting || formData.description.length < 100} variant="outline" className="w-full">
                  {isExtracting ? (
                    <><div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" /> Extracting skills...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Extract Skills with AI</>
                  )}
                </Button>
              </>
            )}

            {/* Step 3: Skills */}
            {currentStep === 3 && !isExtracting && (
              <>
                <div className="flex gap-2">
                  <Input placeholder="Add a skill..." value={newSkill} onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSkill()} />
                  <Select value={skillType} onValueChange={(v: any) => setSkillType(v)}>
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="required">Required</SelectItem>
                      <SelectItem value="preferred">Preferred</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={addSkill}><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="space-y-2">
                  <Label>Required Skills (Must-Have)</Label>
                  <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg min-h-[60px]">
                    {formData.requiredSkills.length === 0 ? (
                      <span className="text-muted-foreground text-sm">No required skills added yet</span>
                    ) : formData.requiredSkills.map(skill => (
                      <Badge key={skill} variant="default" className="gap-1">{skill}<X className="w-3 h-3 cursor-pointer" onClick={() => removeSkill(skill, 'required')} /></Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Preferred Skills (Nice-to-Have)</Label>
                  <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg min-h-[60px]">
                    {formData.preferredSkills.length === 0 ? (
                      <span className="text-muted-foreground text-sm">No preferred skills added yet</span>
                    ) : formData.preferredSkills.map(skill => (
                      <Badge key={skill} variant="secondary" className="gap-1">{skill}<X className="w-3 h-3 cursor-pointer" onClick={() => removeSkill(skill, 'preferred')} /></Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Additional Info */}
            {currentStep === 4 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="salary">Salary Range</Label>
                    <Input id="salary" placeholder="e.g., $60,000 - $80,000" value={formData.salaryRange} onChange={(e) => updateField('salaryRange', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Application Deadline</Label>
                    <Input id="deadline" type="date" value={formData.deadline} onChange={(e) => updateField('deadline', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="openings">Number of Openings</Label>
                  <Input id="openings" type="number" min="1" value={formData.numberOfOpenings} onChange={(e) => updateField('numberOfOpenings', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyDesc">Company Description</Label>
                  <Textarea id="companyDesc" placeholder="Tell candidates about your company..." value={formData.companyDescription}
                    onChange={(e) => updateField('companyDescription', e.target.value)} className="min-h-[120px]" />
                </div>
              </>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-muted-foreground">Job Title</p><p className="font-semibold">{formData.title}</p></div>
                  <div><p className="text-sm text-muted-foreground">Location</p><p className="font-semibold">{formData.location}</p></div>
                  <div><p className="text-sm text-muted-foreground">Job Type</p><p className="font-semibold">{formData.jobType}</p></div>
                  <div><p className="text-sm text-muted-foreground">Experience</p><p className="font-semibold">{formData.experienceRequired}</p></div>
                  <div><p className="text-sm text-muted-foreground">Role Type</p><p className="font-semibold">{formData.roleType}</p></div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Required Skills</p>
                  <div className="flex flex-wrap gap-2">{formData.requiredSkills.map(skill => <Badge key={skill}>{skill}</Badge>)}</div>
                </div>
                {formData.preferredSkills.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Preferred Skills</p>
                    <div className="flex flex-wrap gap-2">{formData.preferredSkills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}</div>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Job Description Preview</p>
                  <div className="p-4 bg-muted/30 rounded-lg max-h-40 overflow-y-auto text-sm">{formData.description.slice(0, 500)}...</div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setCurrentStep(prev => prev - 1)} disabled={currentStep === 1}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Previous
              </Button>
              {currentStep < 5 ? (
                <Button onClick={() => setCurrentStep(prev => prev + 1)} disabled={!canProceed()} className="btn-primary">
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handlePost} disabled={isPosting} className="btn-primary">
                  {isPosting ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> Posting...</>
                  ) : (
                    <><Check className="w-4 h-4 mr-2" /> Publish Job</>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PostJobPage;