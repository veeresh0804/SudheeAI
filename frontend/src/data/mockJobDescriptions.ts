import { JobDescription } from '@/types';

export const mockJobDescriptions: JobDescription[] = [
  {
    id: 1,
    title: "AI Engineer Intern",
    company: "TechCorp AI Labs",
    location: "Remote / San Francisco, CA",
    experience: "0-2 years",
    description: `We are looking for an enthusiastic AI Engineer Intern to join our cutting-edge AI research team. You will work on building and deploying machine learning models at scale.

Required Qualifications:
- Strong proficiency in Python programming
- Experience with Machine Learning frameworks (TensorFlow, PyTorch)
- Solid understanding of Deep Learning concepts
- Familiarity with Docker and containerization
- Good understanding of Data Structures and Algorithms
- Experience with NLP or Computer Vision projects

Nice to Have:
- Kubernetes experience for model deployment
- AWS/GCP cloud platform experience
- System Design knowledge
- Published research papers or Kaggle competition rankings

Responsibilities:
- Build and train ML models for production use
- Deploy models using Docker and cloud services
- Collaborate with research team on cutting-edge AI projects
- Optimize model performance and inference speed`,
    requiredSkills: ["Python", "Machine Learning", "TensorFlow", "PyTorch", "Docker", "Deep Learning", "DSA"],
    preferredSkills: ["Kubernetes", "AWS", "System Design", "NLP", "Computer Vision"],
    roleType: "AI"
  },
  {
    id: 2,
    title: "Software Development Engineer",
    company: "StartupXYZ",
    location: "Bangalore, India",
    experience: "0-3 years",
    description: `Join our fast-growing startup as a Software Development Engineer! We're building the next generation of fintech solutions and need talented engineers who love solving complex problems.

Required Qualifications:
- Excellent problem-solving skills with strong DSA foundation
- Proficiency in Java or Python
- Experience with Spring Boot or similar backend frameworks
- Understanding of System Design principles
- Experience with SQL databases
- Familiarity with microservices architecture

Nice to Have:
- Experience with React or Angular for frontend
- Knowledge of message queues (Kafka, RabbitMQ)
- Docker and Kubernetes experience
- AWS or GCP cloud experience

What You'll Do:
- Design and implement scalable backend services
- Write clean, maintainable, and well-tested code
- Participate in code reviews and architectural discussions
- Optimize system performance and reliability`,
    requiredSkills: ["DSA", "System Design", "Java", "Spring Boot", "SQL", "Microservices"],
    preferredSkills: ["React", "Kafka", "Docker", "Kubernetes", "AWS"],
    roleType: "SDE"
  },
  {
    id: 3,
    title: "Data Analyst",
    company: "Analytics Pro",
    location: "New York, NY",
    experience: "0-2 years",
    description: `We're seeking a detail-oriented Data Analyst to transform raw data into actionable business insights. You'll work closely with product and business teams to drive data-informed decisions.

Required Qualifications:
- Strong SQL skills for complex queries and data manipulation
- Proficiency in Python for data analysis (Pandas, NumPy)
- Experience with data visualization tools (Tableau, Power BI)
- Strong Excel skills including pivot tables and formulas
- Understanding of statistical analysis methods
- Excellent communication skills for presenting findings

Nice to Have:
- Experience with A/B testing and experimentation
- Knowledge of data warehousing concepts
- Machine Learning basics for predictive analytics
- Experience with cloud data platforms (BigQuery, Snowflake)

Responsibilities:
- Analyze large datasets to identify trends and patterns
- Build dashboards and reports for stakeholders
- Support product teams with data-driven insights
- Maintain data quality and documentation`,
    requiredSkills: ["SQL", "Python", "Pandas", "Tableau", "Excel", "Data Analysis", "Statistics"],
    preferredSkills: ["Power BI", "A/B Testing", "BigQuery", "Machine Learning"],
    roleType: "Data Analyst"
  },
  {
    id: 4,
    title: "Full-Stack Developer",
    company: "WebScale Solutions",
    location: "Austin, TX (Hybrid)",
    experience: "1-3 years",
    description: `Looking for a Full-Stack Developer to build beautiful, performant web applications. You'll own features end-to-end, from database design to frontend implementation.

Required Qualifications:
- Strong proficiency in React.js or Vue.js
- Backend experience with Node.js and Express
- Database experience with PostgreSQL or MongoDB
- Understanding of RESTful API design
- Knowledge of TypeScript
- Familiarity with Git and CI/CD practices

Nice to Have:
- Experience with GraphQL
- Knowledge of cloud deployment (AWS, Vercel)
- Understanding of System Design principles
- Experience with testing frameworks (Jest, Cypress)

What You'll Build:
- User-facing features with React/Vue
- Backend APIs and services
- Database schemas and queries
- CI/CD pipelines for deployment`,
    requiredSkills: ["React", "Node.js", "Express", "PostgreSQL", "MongoDB", "TypeScript", "REST API"],
    preferredSkills: ["GraphQL", "AWS", "System Design", "Jest", "Docker"],
    roleType: "Full-Stack"
  },
  {
    id: 5,
    title: "Machine Learning Engineer",
    company: "AI Dynamics",
    location: "Seattle, WA",
    experience: "1-4 years",
    description: `Join our ML Engineering team to build production-ready machine learning systems. You'll bridge the gap between research and production, deploying models that serve millions of users.

Required Qualifications:
- Strong Python programming skills
- Deep understanding of Machine Learning algorithms
- Experience with PyTorch or TensorFlow
- Familiarity with ML ops practices (MLflow, Kubeflow)
- Experience with Docker and cloud platforms
- Strong understanding of Data Structures and Algorithms

Nice to Have:
- Experience with distributed training (Horovod, Ray)
- Knowledge of model optimization (ONNX, TensorRT)
- Experience with feature stores (Feast, Tecton)
- Published research or open source contributions

Key Responsibilities:
- Design and implement ML pipelines
- Deploy and monitor models in production
- Optimize model performance and latency
- Collaborate with data scientists and engineers`,
    requiredSkills: ["Python", "Machine Learning", "PyTorch", "TensorFlow", "Docker", "MLOps", "DSA"],
    preferredSkills: ["Kubernetes", "MLflow", "Distributed Systems", "Model Optimization"],
    roleType: "ML Engineer"
  }
];
