import React from 'react';
import { Link } from 'react-router-dom';
import {
  BrainCircuit,
  Users,
  GraduationCap,
  Code2,
  Github,
  Linkedin,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  Shield,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-hero-pattern opacity-50" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 animate-fade-in">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Talent Intelligence</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight animate-fade-in-up">
              Replace Resume Screening with{' '}
              <span className="gradient-text">Evidence-Based Hiring</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Rank candidates using verified skills from LeetCode, GitHub, and LinkedIn.
              Make hiring decisions backed by real proof, not keyword-stuffed resumes.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <Link to="/recruiter">
                <Button className="btn-primary text-lg px-8 py-6 group">
                  <Users className="w-5 h-5 mr-2" />
                  For Recruiters
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/student">
                <Button className="btn-secondary text-lg px-8 py-6 group">
                  <GraduationCap className="w-5 h-5 mr-2" />
                  For Students
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {/* Platform Icons */}
            <div className="flex items-center justify-center gap-8 pt-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Code2 className="w-6 h-6 text-leetcode" />
                <span className="hidden sm:inline">LeetCode</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Github className="w-6 h-6" />
                <span className="hidden sm:inline">GitHub</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Linkedin className="w-6 h-6 text-linkedin" />
                <span className="hidden sm:inline">LinkedIn</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why <span className="gradient-text">SudheeAI</span>?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We aggregate verified signals from multiple platforms to give you a complete picture of each candidate's abilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass-card-hover p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Multi-Platform Intelligence</h3>
              <p className="text-muted-foreground">
                Aggregates data from LeetCode problem-solving, GitHub projects, and LinkedIn professional activity.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card-hover p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <BrainCircuit className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Explainable AI</h3>
              <p className="text-muted-foreground">
                Every ranking comes with transparent reasoning. Know exactly why each candidate scored the way they did.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card-hover p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Bias-Free Hiring</h3>
              <p className="text-muted-foreground">
                Focus on skills, not demographics. Anonymized profiles remove name, college, and gender from evaluation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Problem */}
            <div className="glass-card p-8 border-l-4 border-destructive space-y-6">
              <div className="flex items-center gap-3">
                <XCircle className="w-8 h-8 text-destructive" />
                <h3 className="text-2xl font-bold">The Problem</h3>
              </div>
              <ul className="space-y-4">
                {[
                  'Recruiters receive 1000+ identical-looking resumes',
                  'Skills are keyword-stuffed with no verification',
                  'No proof of actual technical ability',
                  'Rich signals on GitHub, LeetCode are unused',
                  'Bias creeps in from names and college names'
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Solution */}
            <div className="glass-card p-8 border-l-4 border-success space-y-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-success" />
                <h3 className="text-2xl font-bold">Our Solution</h3>
              </div>
              <ul className="space-y-4">
                {[
                  'AI analyzes job descriptions to extract required skills',
                  'Aggregates verified signals from LeetCode, GitHub, LinkedIn',
                  'Ranks candidates by actual skill match, not keywords',
                  'Explains every ranking with detailed breakdowns',
                  'Helps students understand their job readiness'
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Demo CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Hiring?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Try our live demo with sample candidates and job descriptions. See how AI-powered ranking works.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/recruiter">
              <Button className="btn-primary px-8 py-6 text-lg">
                Try Recruiter Demo
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/student">
              <Button className="btn-secondary px-8 py-6 text-lg">
                Check Your Eligibility
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p className="flex items-center justify-center gap-2">
            <BrainCircuit className="w-5 h-5 text-primary" />
            <span>SudheeAI — AI-Powered Career Intelligence Platform</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
