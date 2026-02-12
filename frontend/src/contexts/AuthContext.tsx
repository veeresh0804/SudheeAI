import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export type UserType = 'recruiter' | 'student' | null;

export interface RecruiterProfile {
  id: string;
  companyName: string;
  recruiterName: string;
  email: string;
  designation?: string;
  companyWebsite?: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  institution: string;
  degree: string;
  branch: string;
  graduationYear: number;
  profileComplete: boolean;
  platformLinks?: {
    leetcode?: string;
    github?: string;
    linkedin?: string;
  };
  extractedData?: {
    leetcode?: any;
    github?: any;
    linkedin?: any;
  };
  resumeUrl?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userType: UserType;
  isAuthenticated: boolean;
  isLoading: boolean;
  recruiterProfile: RecruiterProfile | null;
  studentProfile: StudentProfile | null;
  signUp: (email: string, password: string, metadata: Record<string, any>) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  updateStudentProfile: (updates: Partial<StudentProfile>) => void;
  refreshProfile: () => Promise<void>;
  // Legacy methods for demo mode
  loginAsRecruiter: (profile: RecruiterProfile) => void;
  loginAsStudent: (profile: StudentProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userType, setUserType] = useState<UserType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recruiterProfile, setRecruiterProfile] = useState<RecruiterProfile | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !profile) return;

      const type = profile.user_type as UserType;
      setUserType(type);

      if (type === 'recruiter') {
        setRecruiterProfile({
          id: profile.user_id,
          companyName: profile.company_name || '',
          recruiterName: profile.full_name || '',
          email: profile.email || '',
          designation: profile.designation || '',
          companyWebsite: profile.company_website || '',
        });
        setStudentProfile(null);
      } else if (type === 'student') {
        // Also fetch student_profiles
        const { data: sp } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        setStudentProfile({
          id: profile.user_id,
          name: profile.full_name || '',
          email: profile.email || '',
          institution: profile.institution || '',
          degree: profile.degree || '',
          branch: profile.branch || '',
          graduationYear: profile.graduation_year || new Date().getFullYear(),
          profileComplete: profile.profile_complete || false,
          platformLinks: sp ? {
            leetcode: sp.leetcode_url || undefined,
            github: sp.github_url || undefined,
            linkedin: sp.linkedin_url || undefined,
          } : undefined,
          extractedData: sp ? {
            leetcode: sp.leetcode_data,
            github: sp.github_data,
            linkedin: sp.linkedin_data,
          } : undefined,
          resumeUrl: sp?.resume_url || undefined,
        });
        setRecruiterProfile(null);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Use setTimeout to avoid deadlock with Supabase auth
        setTimeout(() => fetchProfile(session.user.id), 0);
        setIsDemo(false);
      } else {
        // Check for demo session in localStorage
        const demoType = localStorage.getItem('demo_user_type') as UserType;
        const demoProfile = localStorage.getItem('demo_profile');

        if (demoType && demoProfile) {
          const parsedProfile = JSON.parse(demoProfile);
          setUser({ id: 'demo-user', email: parsedProfile.email } as any);
          setUserType(demoType);
          setIsDemo(true);
          if (demoType === 'recruiter') setRecruiterProfile(parsedProfile);
          else setStudentProfile(parsedProfile);
        } else {
          setUserType(null);
          setRecruiterProfile(null);
          setStudentProfile(null);
          setIsDemo(false);
        }
      }
      setIsLoading(false);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
        setIsDemo(false);
      } else {
        // Check for demo session if no real session
        const demoType = localStorage.getItem('demo_user_type') as UserType;
        const demoProfile = localStorage.getItem('demo_profile');
        if (demoType && demoProfile) {
          const parsedProfile = JSON.parse(demoProfile);
          setUser({ id: 'demo-user', email: parsedProfile.email } as any);
          setUserType(demoType);
          setIsDemo(true);
          if (demoType === 'recruiter') setRecruiterProfile(parsedProfile);
          else setStudentProfile(parsedProfile);
        }
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = useCallback(async (email: string, password: string, metadata: Record<string, any>) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('demo_user_type');
    localStorage.removeItem('demo_profile');
    setUser(null);
    setSession(null);
    setUserType(null);
    setRecruiterProfile(null);
    setStudentProfile(null);
    setIsDemo(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  const updateStudentProfile = useCallback((updates: Partial<StudentProfile>) => {
    setStudentProfile(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  // Legacy demo login methods
  const loginAsRecruiter = useCallback((profile: RecruiterProfile) => {
    localStorage.setItem('demo_user_type', 'recruiter');
    localStorage.setItem('demo_profile', JSON.stringify(profile));
    setUser({ id: 'demo-user', email: profile.email } as any);
    setUserType('recruiter');
    setRecruiterProfile(profile);
    setStudentProfile(null);
    setIsDemo(true);
  }, []);

  const loginAsStudent = useCallback((profile: StudentProfile) => {
    localStorage.setItem('demo_user_type', 'student');
    localStorage.setItem('demo_profile', JSON.stringify(profile));
    setUser({ id: 'demo-user', email: profile.email } as any);
    setUserType('student');
    setStudentProfile(profile);
    setRecruiterProfile(null);
    setIsDemo(true);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      userType,
      isAuthenticated: userType !== null,
      isLoading,
      recruiterProfile,
      studentProfile,
      signUp,
      signIn,
      logout,
      updateStudentProfile,
      refreshProfile,
      loginAsRecruiter,
      loginAsStudent,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
