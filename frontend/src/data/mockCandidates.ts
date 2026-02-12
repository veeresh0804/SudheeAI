import { Candidate } from '@/types';

export const mockCandidates: Candidate[] = [
  {
    id: 1,
    name: "Alice Johnson",
    anonymizedName: "Candidate A",
    leetcode: {
      problemsSolved: 420,
      easy: 150,
      medium: 200,
      hard: 70,
      topics: ["Dynamic Programming", "Graphs", "Arrays", "Trees", "Binary Search"],
      contestRating: 1850,
      streakDays: 45
    },
    github: {
      totalRepos: 8,
      relevantRepos: [
        {
          name: "ml-pipeline",
          description: "End-to-end ML pipeline with Docker deployment",
          topics: ["Python", "Machine Learning", "Docker", "TensorFlow"],
          stars: 23,
          commitsLastMonth: 45,
          lastUpdated: "2024-01-15"
        },
        {
          name: "ai-chatbot",
          description: "Conversational AI using transformer models",
          topics: ["Python", "NLP", "OpenAI", "FastAPI"],
          stars: 12,
          commitsLastMonth: 18,
          lastUpdated: "2024-01-10"
        },
        {
          name: "recommendation-engine",
          description: "Collaborative filtering recommendation system",
          topics: ["Python", "Machine Learning", "Pandas", "Scikit-learn"],
          stars: 8,
          commitsLastMonth: 12,
          lastUpdated: "2023-12-20"
        }
      ],
      totalCommitsLastMonth: 67,
      languages: ["Python", "JavaScript", "TypeScript"]
    },
    linkedin: {
      skills: ["Python", "TensorFlow", "Machine Learning", "Data Science", "Docker", "Deep Learning", "NLP"],
      internships: [
        {
          company: "TechCorp AI Labs",
          role: "AI Research Intern",
          duration: "6 months",
          skillsUsed: ["Python", "TensorFlow", "PyTorch"]
        },
        {
          company: "DataVentures",
          role: "ML Intern",
          duration: "3 months",
          skillsUsed: ["Python", "Scikit-learn", "Pandas"]
        }
      ],
      certifications: ["AWS ML Specialty", "Deep Learning Specialization", "TensorFlow Developer"],
      postsLastMonth: 5,
      engagementScore: 78
    },
    overallProfileStrength: 92
  },
  {
    id: 2,
    name: "Bob Smith",
    anonymizedName: "Candidate B",
    leetcode: {
      problemsSolved: 280,
      easy: 100,
      medium: 140,
      hard: 40,
      topics: ["Arrays", "Strings", "Trees", "Dynamic Programming"],
      contestRating: 1600,
      streakDays: 20
    },
    github: {
      totalRepos: 12,
      relevantRepos: [
        {
          name: "ecommerce-platform",
          description: "Full-stack e-commerce with React and Node.js",
          topics: ["React", "Node.js", "MongoDB", "Express"],
          stars: 34,
          commitsLastMonth: 28,
          lastUpdated: "2024-01-18"
        },
        {
          name: "task-manager-api",
          description: "RESTful API for task management",
          topics: ["Node.js", "Express", "PostgreSQL", "JWT"],
          stars: 15,
          commitsLastMonth: 12,
          lastUpdated: "2024-01-05"
        }
      ],
      totalCommitsLastMonth: 42,
      languages: ["JavaScript", "TypeScript", "Python"]
    },
    linkedin: {
      skills: ["JavaScript", "React", "Node.js", "MongoDB", "Express", "SQL"],
      internships: [
        {
          company: "WebDev Studio",
          role: "Full-Stack Intern",
          duration: "4 months",
          skillsUsed: ["React", "Node.js", "MongoDB"]
        }
      ],
      certifications: ["Meta Front-End Developer", "AWS Cloud Practitioner"],
      postsLastMonth: 2,
      engagementScore: 45
    },
    overallProfileStrength: 75
  },
  {
    id: 3,
    name: "Carol White",
    anonymizedName: "Candidate C",
    leetcode: {
      problemsSolved: 120,
      easy: 60,
      medium: 50,
      hard: 10,
      topics: ["Arrays", "Strings", "Hash Tables"],
      contestRating: 1400,
      streakDays: 8
    },
    github: {
      totalRepos: 15,
      relevantRepos: [
        {
          name: "data-visualization-dashboard",
          description: "Interactive dashboard using D3.js and React",
          topics: ["React", "D3.js", "TypeScript", "Data Visualization"],
          stars: 89,
          commitsLastMonth: 56,
          lastUpdated: "2024-01-20"
        },
        {
          name: "open-source-cms",
          description: "Headless CMS built with Next.js",
          topics: ["Next.js", "TypeScript", "GraphQL", "Prisma"],
          stars: 156,
          commitsLastMonth: 78,
          lastUpdated: "2024-01-19"
        },
        {
          name: "portfolio-template",
          description: "Modern portfolio template",
          topics: ["React", "Tailwind CSS", "Framer Motion"],
          stars: 234,
          commitsLastMonth: 23,
          lastUpdated: "2024-01-12"
        }
      ],
      totalCommitsLastMonth: 145,
      languages: ["TypeScript", "JavaScript", "Python", "Go"]
    },
    linkedin: {
      skills: ["React", "TypeScript", "Next.js", "GraphQL", "System Design", "Leadership"],
      internships: [
        {
          company: "Meta",
          role: "Frontend Intern",
          duration: "3 months",
          skillsUsed: ["React", "GraphQL"]
        },
        {
          company: "Stripe",
          role: "Software Engineering Intern",
          duration: "4 months",
          skillsUsed: ["TypeScript", "React", "Node.js"]
        },
        {
          company: "Airbnb",
          role: "Full-Stack Intern",
          duration: "3 months",
          skillsUsed: ["React", "Ruby on Rails"]
        }
      ],
      certifications: ["Google Cloud Professional", "System Design Certificate"],
      postsLastMonth: 8,
      engagementScore: 92
    },
    overallProfileStrength: 85
  },
  {
    id: 4,
    name: "David Lee",
    anonymizedName: "Candidate D",
    leetcode: {
      problemsSolved: 350,
      easy: 100,
      medium: 180,
      hard: 70,
      topics: ["Dynamic Programming", "Graphs", "Greedy", "Binary Search", "Trees"],
      contestRating: 1750,
      streakDays: 60
    },
    github: {
      totalRepos: 5,
      relevantRepos: [
        {
          name: "algorithm-visualizer",
          description: "Interactive algorithm visualization tool",
          topics: ["React", "TypeScript", "Algorithms", "D3.js"],
          stars: 45,
          commitsLastMonth: 32,
          lastUpdated: "2024-01-17"
        },
        {
          name: "coding-interview-prep",
          description: "Solutions to 200+ coding problems",
          topics: ["Python", "Java", "Algorithms", "Data Structures"],
          stars: 78,
          commitsLastMonth: 24,
          lastUpdated: "2024-01-20"
        }
      ],
      totalCommitsLastMonth: 56,
      languages: ["Python", "Java", "TypeScript"]
    },
    linkedin: {
      skills: ["DSA", "Python", "Java", "Problem Solving", "System Design"],
      internships: [
        {
          company: "Google",
          role: "STEP Intern",
          duration: "3 months",
          skillsUsed: ["Java", "Algorithms", "Distributed Systems"]
        }
      ],
      certifications: ["Google foobar Completion", "ICPC Regionalist"],
      postsLastMonth: 3,
      engagementScore: 65
    },
    overallProfileStrength: 82
  },
  {
    id: 5,
    name: "Emma Davis",
    anonymizedName: "Candidate E",
    leetcode: {
      problemsSolved: 150,
      easy: 80,
      medium: 60,
      hard: 10,
      topics: ["SQL", "Arrays", "Hash Tables", "Strings"],
      contestRating: 1350,
      streakDays: 15
    },
    github: {
      totalRepos: 7,
      relevantRepos: [
        {
          name: "data-analysis-toolkit",
          description: "Comprehensive data analysis with Pandas",
          topics: ["Python", "Pandas", "NumPy", "Data Analysis"],
          stars: 28,
          commitsLastMonth: 35,
          lastUpdated: "2024-01-18"
        },
        {
          name: "sql-mastery",
          description: "Advanced SQL queries and optimizations",
          topics: ["SQL", "PostgreSQL", "MySQL", "Database"],
          stars: 42,
          commitsLastMonth: 18,
          lastUpdated: "2024-01-10"
        },
        {
          name: "tableau-dashboards",
          description: "Business intelligence dashboard collection",
          topics: ["Tableau", "Data Visualization", "Business Intelligence"],
          stars: 19,
          commitsLastMonth: 8,
          lastUpdated: "2024-01-05"
        }
      ],
      totalCommitsLastMonth: 48,
      languages: ["Python", "SQL", "R"]
    },
    linkedin: {
      skills: ["SQL", "Python", "Pandas", "Tableau", "Data Analysis", "Excel", "Power BI"],
      internships: [
        {
          company: "Analytics Corp",
          role: "Data Analyst Intern",
          duration: "6 months",
          skillsUsed: ["SQL", "Python", "Tableau"]
        },
        {
          company: "FinTech Solutions",
          role: "Business Intelligence Intern",
          duration: "3 months",
          skillsUsed: ["Power BI", "Excel", "SQL"]
        }
      ],
      certifications: ["Google Data Analytics", "Tableau Desktop Specialist", "SQL Expert"],
      postsLastMonth: 4,
      engagementScore: 58
    },
    overallProfileStrength: 78
  },
  {
    id: 6,
    name: "Frank Miller",
    anonymizedName: "Candidate F",
    leetcode: {
      problemsSolved: 80,
      easy: 50,
      medium: 25,
      hard: 5,
      topics: ["Arrays", "Strings"],
      contestRating: 1200,
      streakDays: 5
    },
    github: {
      totalRepos: 3,
      relevantRepos: [
        {
          name: "personal-blog",
          description: "Simple blog with WordPress",
          topics: ["WordPress", "PHP", "CSS"],
          stars: 2,
          commitsLastMonth: 5,
          lastUpdated: "2023-12-01"
        }
      ],
      totalCommitsLastMonth: 8,
      languages: ["PHP", "JavaScript"]
    },
    linkedin: {
      skills: ["WordPress", "HTML", "CSS", "Basic JavaScript"],
      internships: [],
      certifications: ["freeCodeCamp Responsive Web Design"],
      postsLastMonth: 0,
      engagementScore: 15
    },
    overallProfileStrength: 35
  },
  {
    id: 7,
    name: "Grace Kim",
    anonymizedName: "Candidate G",
    leetcode: {
      problemsSolved: 520,
      easy: 150,
      medium: 280,
      hard: 90,
      topics: ["Dynamic Programming", "Graphs", "Trees", "Heap", "Trie", "Segment Tree"],
      contestRating: 2100,
      streakDays: 120
    },
    github: {
      totalRepos: 6,
      relevantRepos: [
        {
          name: "distributed-cache",
          description: "Redis-like distributed caching system",
          topics: ["Go", "Distributed Systems", "Redis", "System Design"],
          stars: 156,
          commitsLastMonth: 42,
          lastUpdated: "2024-01-19"
        },
        {
          name: "load-balancer",
          description: "Custom load balancer implementation",
          topics: ["Go", "Networking", "System Design"],
          stars: 89,
          commitsLastMonth: 28,
          lastUpdated: "2024-01-15"
        }
      ],
      totalCommitsLastMonth: 78,
      languages: ["Go", "Python", "C++"]
    },
    linkedin: {
      skills: ["System Design", "Distributed Systems", "Go", "C++", "DSA", "Backend Development"],
      internships: [
        {
          company: "Amazon",
          role: "SDE Intern",
          duration: "3 months",
          skillsUsed: ["Java", "AWS", "System Design"]
        },
        {
          company: "Microsoft",
          role: "SWE Intern",
          duration: "3 months",
          skillsUsed: ["C#", "Azure", "Distributed Systems"]
        }
      ],
      certifications: ["AWS Solutions Architect", "System Design Expert"],
      postsLastMonth: 6,
      engagementScore: 82
    },
    overallProfileStrength: 95
  },
  {
    id: 8,
    name: "Henry Zhang",
    anonymizedName: "Candidate H",
    leetcode: {
      problemsSolved: 200,
      easy: 80,
      medium: 100,
      hard: 20,
      topics: ["Arrays", "Trees", "Graphs", "Dynamic Programming"],
      contestRating: 1500,
      streakDays: 25
    },
    github: {
      totalRepos: 10,
      relevantRepos: [
        {
          name: "mobile-app-flutter",
          description: "Cross-platform mobile app",
          topics: ["Flutter", "Dart", "Mobile Development"],
          stars: 34,
          commitsLastMonth: 45,
          lastUpdated: "2024-01-18"
        },
        {
          name: "firebase-auth-demo",
          description: "Firebase authentication examples",
          topics: ["Firebase", "React Native", "Authentication"],
          stars: 21,
          commitsLastMonth: 12,
          lastUpdated: "2024-01-10"
        }
      ],
      totalCommitsLastMonth: 52,
      languages: ["Dart", "JavaScript", "TypeScript"]
    },
    linkedin: {
      skills: ["Flutter", "Dart", "React Native", "Mobile Development", "Firebase"],
      internships: [
        {
          company: "Mobile Innovations",
          role: "Mobile Dev Intern",
          duration: "4 months",
          skillsUsed: ["Flutter", "Firebase", "Dart"]
        }
      ],
      certifications: ["Flutter Developer Certification"],
      postsLastMonth: 2,
      engagementScore: 42
    },
    overallProfileStrength: 68
  },
  {
    id: 9,
    name: "Ivy Chen",
    anonymizedName: "Candidate I",
    leetcode: {
      problemsSolved: 380,
      easy: 120,
      medium: 200,
      hard: 60,
      topics: ["Dynamic Programming", "Neural Networks", "Graph Algorithms", "Math"],
      contestRating: 1780,
      streakDays: 40
    },
    github: {
      totalRepos: 9,
      relevantRepos: [
        {
          name: "transformer-from-scratch",
          description: "Implementing transformers from scratch in PyTorch",
          topics: ["Python", "PyTorch", "Deep Learning", "NLP", "Transformers"],
          stars: 234,
          commitsLastMonth: 38,
          lastUpdated: "2024-01-20"
        },
        {
          name: "computer-vision-projects",
          description: "Collection of CV projects using OpenCV and TensorFlow",
          topics: ["Python", "TensorFlow", "OpenCV", "Computer Vision"],
          stars: 156,
          commitsLastMonth: 25,
          lastUpdated: "2024-01-15"
        },
        {
          name: "kaggle-competitions",
          description: "Solutions to Kaggle competitions",
          topics: ["Python", "Machine Learning", "XGBoost", "Data Science"],
          stars: 89,
          commitsLastMonth: 18,
          lastUpdated: "2024-01-12"
        }
      ],
      totalCommitsLastMonth: 82,
      languages: ["Python", "C++", "Julia"]
    },
    linkedin: {
      skills: ["Deep Learning", "PyTorch", "TensorFlow", "Computer Vision", "NLP", "Research"],
      internships: [
        {
          company: "OpenAI",
          role: "Research Intern",
          duration: "4 months",
          skillsUsed: ["Python", "PyTorch", "Transformers"]
        },
        {
          company: "DeepMind",
          role: "ML Intern",
          duration: "3 months",
          skillsUsed: ["Python", "JAX", "Reinforcement Learning"]
        }
      ],
      certifications: ["Deep Learning Specialization", "Stanford ML Course"],
      postsLastMonth: 7,
      engagementScore: 88
    },
    overallProfileStrength: 94
  },
  {
    id: 10,
    name: "Jack Wilson",
    anonymizedName: "Candidate J",
    leetcode: {
      problemsSolved: 160,
      easy: 70,
      medium: 70,
      hard: 20,
      topics: ["Arrays", "Strings", "Trees", "Hash Tables"],
      contestRating: 1450,
      streakDays: 12
    },
    github: {
      totalRepos: 6,
      relevantRepos: [
        {
          name: "devops-automation",
          description: "CI/CD pipeline automation scripts",
          topics: ["Docker", "Kubernetes", "Jenkins", "DevOps"],
          stars: 45,
          commitsLastMonth: 32,
          lastUpdated: "2024-01-17"
        },
        {
          name: "terraform-modules",
          description: "Reusable Terraform modules for AWS",
          topics: ["Terraform", "AWS", "Infrastructure as Code"],
          stars: 67,
          commitsLastMonth: 24,
          lastUpdated: "2024-01-14"
        }
      ],
      totalCommitsLastMonth: 58,
      languages: ["Python", "Go", "Shell"]
    },
    linkedin: {
      skills: ["Docker", "Kubernetes", "AWS", "Terraform", "CI/CD", "DevOps"],
      internships: [
        {
          company: "CloudTech",
          role: "DevOps Intern",
          duration: "5 months",
          skillsUsed: ["Docker", "Kubernetes", "AWS"]
        }
      ],
      certifications: ["AWS DevOps Engineer", "Kubernetes Administrator", "Docker Certified"],
      postsLastMonth: 3,
      engagementScore: 55
    },
    overallProfileStrength: 72
  }
];
