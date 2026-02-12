import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BrainCircuit, Users, GraduationCap, Menu, X, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { userType, isAuthenticated, recruiterProfile, studentProfile, logout } = useAuth();

  const getNavLinks = () => {
    if (userType === 'recruiter') {
      return [
        { path: '/recruiter/dashboard', label: 'Dashboard' },
        { path: '/recruiter/post-job', label: 'Post Job' },
      ];
    }
    if (userType === 'student') {
      return [
        { path: '/student/dashboard', label: 'Dashboard' },
        { path: '/student/jobs', label: 'Browse Jobs' },
        { path: '/student/applications', label: 'My Applications' },
        { path: '/student/profile', label: 'My Profile' },
      ];
    }
    return [];
  };

  const navLinks = getNavLinks();
  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getUserName = () => {
    if (userType === 'recruiter') return recruiterProfile?.recruiterName || 'Recruiter';
    if (userType === 'student') return studentProfile?.name || 'Student';
    return '';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to={isAuthenticated ? (userType === 'recruiter' ? '/recruiter/dashboard' : '/student/dashboard') : '/'} className="flex items-center gap-2 group">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-secondary group-hover:shadow-lg group-hover:shadow-primary/25 transition-all duration-300">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg hidden sm:block">
              <span className="gradient-text">Sudhee</span>
              <span className="text-foreground">AI</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {!isAuthenticated ? (
              <>
                <Link to="/recruiter/login">
                  <Button variant="ghost" className="gap-2"><Users className="w-4 h-4" /> For Recruiters</Button>
                </Link>
                <Link to="/student/login">
                  <Button variant="ghost" className="gap-2"><GraduationCap className="w-4 h-4" /> For Students</Button>
                </Link>
              </>
            ) : (
              <>
                {navLinks.map((link) => (
                  <Link key={link.path} to={link.path}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${isActive(link.path) ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
                    {link.label}
                  </Link>
                ))}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 ml-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                        userType === 'recruiter' ? 'bg-blue-500' : 'bg-purple-500'}`}>
                        {getUserName().charAt(0)}
                      </div>
                      <span className="hidden lg:inline">{getUserName()}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem disabled>
                      <User className="w-4 h-4 mr-2" />
                      {userType === 'recruiter' ? recruiterProfile?.companyName : studentProfile?.institution}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <LogOut className="w-4 h-4 mr-2" /> Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>

          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-2">
              {!isAuthenticated ? (
                <>
                  <Link to="/recruiter/login" onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium hover:bg-muted/50">
                    <Users className="w-5 h-5" /> For Recruiters
                  </Link>
                  <Link to="/student/login" onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium hover:bg-muted/50">
                    <GraduationCap className="w-5 h-5" /> For Students
                  </Link>
                </>
              ) : (
                <>
                  {navLinks.map((link) => (
                    <Link key={link.path} to={link.path} onClick={() => setIsMobileMenuOpen(false)}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                        ${isActive(link.path) ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
                      {link.label}
                    </Link>
                  ))}
                  <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10">
                    <LogOut className="w-5 h-5" /> Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
