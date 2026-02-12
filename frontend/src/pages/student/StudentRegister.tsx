import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, User, School, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const StudentRegister: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', institution: '',
    degree: '', branch: '', graduationYear: '', password: '', confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.institution.trim()) newErrors.institution = 'Institution is required';
    if (!formData.degree) newErrors.degree = 'Degree is required';
    if (!formData.branch) newErrors.branch = 'Branch is required';
    if (!formData.graduationYear) newErrors.graduationYear = 'Graduation year is required';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Min 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    const { error } = await signUp(formData.email, formData.password, {
      full_name: formData.name,
      user_type: 'student',
    });

    if (error) {
      toast({ title: 'Registration failed', description: error.message, variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    // Update profile with additional student fields (trigger creates base profile)
    // We need to wait for the session to be established
    toast({
      title: 'Account created!',
      description: 'Please check your email to verify your account, then log in.',
    });

    navigate('/student/login');
    setIsLoading(false);
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear + i);

  return (
    <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-md">
        <Card className="glass-card animate-fade-in">
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-purple-500" />
            </div>
            <CardTitle className="text-2xl">Student Registration</CardTitle>
            <CardDescription>Create your account to find opportunities</CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="name" placeholder="John Doe" value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)} className={`pl-10 ${errors.name ? 'border-destructive' : ''}`} />
                </div>
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="you@university.edu" value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)} className={`pl-10 ${errors.email ? 'border-destructive' : ''}`} />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="institution">Institution *</Label>
                <div className="relative">
                  <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="institution" placeholder="University Name" value={formData.institution}
                    onChange={(e) => updateField('institution', e.target.value)} className={`pl-10 ${errors.institution ? 'border-destructive' : ''}`} />
                </div>
                {errors.institution && <p className="text-xs text-destructive">{errors.institution}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Degree *</Label>
                  <Select value={formData.degree} onValueChange={(v) => updateField('degree', v)}>
                    <SelectTrigger className={errors.degree ? 'border-destructive' : ''}><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {['B.Tech', 'B.E', 'M.Tech', 'MCA', 'BCA', 'B.Sc', 'M.Sc'].map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.degree && <p className="text-xs text-destructive">{errors.degree}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Branch *</Label>
                  <Select value={formData.branch} onValueChange={(v) => updateField('branch', v)}>
                    <SelectTrigger className={errors.branch ? 'border-destructive' : ''}><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {['Computer Science', 'Information Technology', 'Electronics', 'Data Science', 'AI/ML', 'Other'].map(b => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.branch && <p className="text-xs text-destructive">{errors.branch}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Graduation Year *</Label>
                <Select value={formData.graduationYear} onValueChange={(v) => updateField('graduationYear', v)}>
                  <SelectTrigger className={errors.graduationYear ? 'border-destructive' : ''}><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>
                    {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.graduationYear && <p className="text-xs text-destructive">{errors.graduationYear}</p>}
              </div>

              <div className="space-y-2">
                <Label>Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type={showPassword ? 'text' : 'password'} placeholder="Min 8 characters" value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)} className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label>Confirm Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="password" placeholder="Re-enter password" value={formData.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)} className={`pl-10 ${errors.confirmPassword ? 'border-destructive' : ''}`} />
                </div>
                {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
              </div>

              <Button type="submit" className="btn-secondary w-full" disabled={isLoading}>
                {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4 ml-2" /></>}
              </Button>
            </CardContent>
          </form>

          <CardFooter className="flex flex-col space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Already have an account? <Link to="/student/login" className="text-secondary hover:underline">Sign in</Link>
            </p>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground text-center">← Back to Home</Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default StudentRegister;
