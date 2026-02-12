// Comprehensive skill taxonomy for NLP-based skill extraction

export const skillTaxonomy = {
  programmingLanguages: [
    "Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "Go", "Rust",
    "Ruby", "PHP", "Swift", "Kotlin", "Scala", "R", "Julia", "Dart", "Shell"
  ],
  
  frameworks: {
    frontend: ["React", "Vue.js", "Angular", "Next.js", "Svelte", "Ember.js", "jQuery"],
    backend: ["Node.js", "Express", "Django", "Flask", "FastAPI", "Spring Boot", "Rails", "Laravel", "ASP.NET"],
    mobile: ["React Native", "Flutter", "Swift UI", "Kotlin Android"],
    ml: ["TensorFlow", "PyTorch", "Keras", "Scikit-learn", "XGBoost", "LightGBM", "JAX", "Hugging Face"]
  },
  
  tools: {
    containerization: ["Docker", "Kubernetes", "Podman"],
    cloud: ["AWS", "GCP", "Azure", "Heroku", "Vercel", "DigitalOcean"],
    cicd: ["Jenkins", "GitHub Actions", "GitLab CI", "CircleCI", "Travis CI"],
    versionControl: ["Git", "GitHub", "GitLab", "Bitbucket"],
    monitoring: ["Prometheus", "Grafana", "DataDog", "New Relic", "Sentry"]
  },
  
  concepts: {
    dsa: ["DSA", "Data Structures", "Algorithms", "Dynamic Programming", "Graphs", "Trees", "Arrays", "Linked Lists", "Heap", "Trie", "Segment Tree"],
    systemDesign: ["System Design", "Microservices", "Distributed Systems", "Load Balancing", "Caching", "Message Queues"],
    ml: ["Machine Learning", "Deep Learning", "NLP", "Computer Vision", "Reinforcement Learning", "Neural Networks", "Transformers"],
    dataEngineering: ["ETL", "Data Pipeline", "Data Warehouse", "Data Modeling"]
  },
  
  databases: {
    sql: ["SQL", "PostgreSQL", "MySQL", "SQLite", "Oracle", "SQL Server"],
    nosql: ["MongoDB", "Redis", "Cassandra", "DynamoDB", "Elasticsearch", "Neo4j"],
    cloud: ["BigQuery", "Snowflake", "Redshift", "Firestore"]
  },
  
  dataAnalysis: [
    "Pandas", "NumPy", "Tableau", "Power BI", "Excel", "Data Analysis",
    "Statistics", "A/B Testing", "Data Visualization", "Matplotlib", "Seaborn"
  ],
  
  devops: [
    "DevOps", "CI/CD", "Infrastructure as Code", "Terraform", "Ansible",
    "Configuration Management", "SRE", "Monitoring"
  ]
};

// Synonyms for skill matching
export const skillSynonyms: Record<string, string[]> = {
  "Machine Learning": ["ML", "machine-learning", "machinelearning"],
  "Deep Learning": ["DL", "deep-learning", "deeplearning"],
  "Natural Language Processing": ["NLP", "natural-language-processing"],
  "Computer Vision": ["CV", "computer-vision", "image recognition"],
  "JavaScript": ["JS", "javascript", "es6", "ecmascript"],
  "TypeScript": ["TS", "typescript"],
  "Python": ["python3", "py"],
  "DSA": ["Data Structures and Algorithms", "algorithms", "data structures"],
  "Dynamic Programming": ["DP", "dynamic-programming"],
  "React": ["React.js", "ReactJS", "react.js"],
  "Node.js": ["Node", "NodeJS", "node"],
  "PostgreSQL": ["Postgres", "psql"],
  "MongoDB": ["Mongo"],
  "Kubernetes": ["K8s", "k8s"],
  "Amazon Web Services": ["AWS", "aws"],
  "Google Cloud Platform": ["GCP", "gcp"],
  "Continuous Integration": ["CI", "CI/CD"],
  "Application Programming Interface": ["API", "REST API", "RESTful"],
};

// Role detection keywords
export const roleKeywords: Record<string, string[]> = {
  "AI": ["AI", "artificial intelligence", "machine learning", "deep learning", "neural network", "NLP", "computer vision", "ML engineer"],
  "SDE": ["software development", "backend", "frontend", "full-stack", "software engineer", "developer", "SDE", "SWE"],
  "Data Analyst": ["data analyst", "analytics", "business intelligence", "tableau", "power bi", "sql analyst", "reporting"],
  "Full-Stack": ["full-stack", "full stack", "frontend", "backend", "react", "node", "web development"],
  "ML Engineer": ["ML engineer", "MLOps", "machine learning engineer", "model deployment", "ML infrastructure"]
};

// Get all skills as a flat array for matching
export function getAllSkills(): string[] {
  const allSkills: string[] = [
    ...skillTaxonomy.programmingLanguages,
    ...Object.values(skillTaxonomy.frameworks).flat(),
    ...Object.values(skillTaxonomy.tools).flat(),
    ...Object.values(skillTaxonomy.concepts).flat(),
    ...Object.values(skillTaxonomy.databases).flat(),
    ...skillTaxonomy.dataAnalysis,
    ...skillTaxonomy.devops
  ];
  
  return [...new Set(allSkills)];
}

// Normalize skill name for comparison
export function normalizeSkill(skill: string): string {
  const lowerSkill = skill.toLowerCase().trim();
  
  // Check synonyms
  for (const [canonical, synonyms] of Object.entries(skillSynonyms)) {
    if (synonyms.map(s => s.toLowerCase()).includes(lowerSkill) || 
        canonical.toLowerCase() === lowerSkill) {
      return canonical;
    }
  }
  
  // Find matching skill from taxonomy
  const allSkills = getAllSkills();
  const match = allSkills.find(s => s.toLowerCase() === lowerSkill);
  
  return match || skill;
}
