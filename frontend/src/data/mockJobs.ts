// Mock jobs posted by recruiters
export interface Job {
  id: string;
  recruiterId: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  jobType: 'Intern' | 'Full-time' | 'Part-time' | 'Contract';
  experienceRequired: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  salaryRange?: string;
  deadline?: string;
  status: 'active' | 'closed';
  postedDate: string;
  applicationsCount: number;
  roleType: 'AI' | 'SDE' | 'Data Analyst' | 'Full-Stack' | 'ML Engineer';
}

export interface Application {
  id: string;
  jobId: string;
  studentId: string;
  studentName: string;
  appliedDate: string;
  status: 'pending' | 'under_review' | 'shortlisted' | 'rejected' | 'interview_scheduled';
  matchScore?: number;
  platformScores?: {
    leetcode: number;
    github: number;
    linkedin: number;
  };
}

// Sample jobs
export const mockJobs: Job[] = [
  {
    id: 'job-1',
    recruiterId: 'recruiter-1',
    title: 'AI Engineer Intern',
    company: 'TechCorp AI',
    location: 'Remote',
    jobType: 'Intern',
    experienceRequired: '0-2 years',
    description: `We are looking for a passionate AI Engineer Intern to join our innovative team.

**Required Qualifications:**
- Strong programming skills in Python
- Experience with Machine Learning frameworks (TensorFlow, PyTorch)
- Understanding of deep learning concepts
- Good problem-solving skills demonstrated through LeetCode or similar platforms

**Responsibilities:**
- Develop and deploy ML models
- Work on data preprocessing pipelines
- Collaborate with senior engineers on production systems

**Nice to Have:**
- Experience with Docker and containerization
- Familiarity with cloud platforms (AWS/GCP)
- NLP or Computer Vision project experience`,
    requiredSkills: ['Python', 'Machine Learning', 'TensorFlow', 'Deep Learning', 'DSA'],
    preferredSkills: ['Docker', 'AWS', 'NLP', 'Computer Vision', 'System Design'],
    salaryRange: '$60,000 - $80,000',
    deadline: '2024-03-15',
    status: 'active',
    postedDate: '2024-02-01',
    applicationsCount: 45,
    roleType: 'AI',
  },
  {
    id: 'job-2',
    recruiterId: 'recruiter-1',
    title: 'Software Development Engineer',
    company: 'TechCorp AI',
    location: 'Hybrid - San Francisco',
    jobType: 'Full-time',
    experienceRequired: '2-5 years',
    description: `Join our core engineering team to build scalable backend systems.

**Required Qualifications:**
- Strong DSA skills (500+ LeetCode problems recommended)
- Proficiency in Java or Go
- Experience with distributed systems
- System design knowledge

**Responsibilities:**
- Design and implement backend services
- Optimize system performance
- Mentor junior engineers

**Nice to Have:**
- Kubernetes experience
- Database optimization skills
- Previous startup experience`,
    requiredSkills: ['DSA', 'Java', 'System Design', 'Distributed Systems', 'Spring Boot'],
    preferredSkills: ['Kubernetes', 'PostgreSQL', 'Redis', 'Go'],
    salaryRange: '$150,000 - $200,000',
    status: 'active',
    postedDate: '2024-02-05',
    applicationsCount: 128,
    roleType: 'SDE',
  },
  {
    id: 'job-3',
    recruiterId: 'recruiter-2',
    title: 'Full-Stack Developer',
    company: 'StartupXYZ',
    location: 'On-site - New York',
    jobType: 'Full-time',
    experienceRequired: '1-3 years',
    description: `Build the next generation of our product with modern web technologies.

**Required Qualifications:**
- Proficiency in React and Node.js
- Strong JavaScript/TypeScript skills
- Experience with REST APIs
- Good understanding of databases

**Responsibilities:**
- Develop frontend and backend features
- Collaborate with product and design teams
- Write clean, maintainable code`,
    requiredSkills: ['React', 'Node.js', 'TypeScript', 'JavaScript', 'PostgreSQL'],
    preferredSkills: ['GraphQL', 'Docker', 'AWS', 'Testing'],
    salaryRange: '$120,000 - $160,000',
    status: 'active',
    postedDate: '2024-02-10',
    applicationsCount: 67,
    roleType: 'Full-Stack',
  },
  {
    id: 'job-4',
    recruiterId: 'recruiter-2',
    title: 'Data Analyst Intern',
    company: 'StartupXYZ',
    location: 'Remote',
    jobType: 'Intern',
    experienceRequired: '0-1 years',
    description: `Analyze data to drive business decisions and insights.

**Required Qualifications:**
- Strong SQL skills
- Python for data analysis (Pandas, NumPy)
- Data visualization experience
- Statistics fundamentals

**Responsibilities:**
- Create dashboards and reports
- Analyze user behavior data
- Support product decisions with data`,
    requiredSkills: ['SQL', 'Python', 'Pandas', 'Data Visualization', 'Statistics'],
    preferredSkills: ['Tableau', 'Power BI', 'Excel', 'Machine Learning'],
    status: 'active',
    postedDate: '2024-02-12',
    applicationsCount: 89,
    roleType: 'Data Analyst',
  },
  {
    id: 'job-5',
    recruiterId: 'recruiter-1',
    title: 'ML Engineer',
    company: 'TechCorp AI',
    location: 'Remote',
    jobType: 'Full-time',
    experienceRequired: '3-5 years',
    description: `Build and deploy production ML systems at scale.

**Required Qualifications:**
- Strong ML/DL fundamentals
- Production ML experience
- Python and ML frameworks expertise
- MLOps knowledge

**Responsibilities:**
- Design ML pipelines
- Deploy models to production
- Monitor and optimize model performance`,
    requiredSkills: ['Machine Learning', 'Python', 'TensorFlow', 'PyTorch', 'MLOps'],
    preferredSkills: ['Kubernetes', 'Spark', 'Feature Engineering', 'A/B Testing'],
    salaryRange: '$180,000 - $250,000',
    status: 'active',
    postedDate: '2024-02-08',
    applicationsCount: 34,
    roleType: 'ML Engineer',
  },
];

// Sample applications
export const mockApplications: Application[] = [
  {
    id: 'app-1',
    jobId: 'job-1',
    studentId: '1',
    studentName: 'Alice Johnson',
    appliedDate: '2024-02-05',
    status: 'pending',
  },
  {
    id: 'app-2',
    jobId: 'job-1',
    studentId: '2',
    studentName: 'Bob Smith',
    appliedDate: '2024-02-06',
    status: 'under_review',
  },
  {
    id: 'app-3',
    jobId: 'job-1',
    studentId: '3',
    studentName: 'Carol White',
    appliedDate: '2024-02-07',
    status: 'pending',
  },
  {
    id: 'app-4',
    jobId: 'job-2',
    studentId: '4',
    studentName: 'David Lee',
    appliedDate: '2024-02-08',
    status: 'shortlisted',
  },
  {
    id: 'app-5',
    jobId: 'job-3',
    studentId: '5',
    studentName: 'Emma Davis',
    appliedDate: '2024-02-09',
    status: 'pending',
  },
];

// Helper to get applications for a job
export const getApplicationsForJob = (jobId: string): Application[] => {
  return mockApplications.filter(app => app.jobId === jobId);
};

// Helper to get jobs for a recruiter
export const getJobsForRecruiter = (recruiterId: string): Job[] => {
  return mockJobs.filter(job => job.recruiterId === recruiterId);
};

// Helper to get all active jobs
export const getActiveJobs = (): Job[] => {
  return mockJobs.filter(job => job.status === 'active');
};
