// GitHub API service for fetching real profile data
// Falls back to mock data if API fails

export interface GitHubRepo {
  name: string;
  description: string | null;
  topics: string[];
  languages: string[];
  stars: number;
  forks: number;
  url: string;
  lastUpdated: string;
  isForked: boolean;
}

export interface GitHubProfile {
  username: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  followers: number;
  following: number;
  publicRepos: number;
  repos: GitHubRepo[];
  topLanguages: string[];
  totalStars: number;
  profileUrl: string;
}

// Extract username from GitHub URL
export const extractGitHubUsername = (url: string): string | null => {
  const patterns = [
    /github\.com\/([a-zA-Z0-9_-]+)\/?$/,
    /github\.com\/([a-zA-Z0-9_-]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
};

// Fetch GitHub profile data using public API
export const fetchGitHubProfile = async (usernameOrUrl: string): Promise<GitHubProfile | null> => {
  try {
    const username = usernameOrUrl.includes('github.com') 
      ? extractGitHubUsername(usernameOrUrl) 
      : usernameOrUrl;
    
    if (!username) {
      throw new Error('Invalid GitHub username or URL');
    }

    // Fetch user profile
    const userResponse = await fetch(`https://api.github.com/users/${username}`);
    if (!userResponse.ok) {
      throw new Error('Failed to fetch user profile');
    }
    const userData = await userResponse.json();

    // Fetch repositories
    const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=30&sort=updated`);
    if (!reposResponse.ok) {
      throw new Error('Failed to fetch repositories');
    }
    const reposData = await reposResponse.json();

    // Process repositories
    const repos: GitHubRepo[] = await Promise.all(
      reposData.slice(0, 15).map(async (repo: any) => {
        // Fetch languages for each repo
        let languages: string[] = [];
        try {
          const langResponse = await fetch(repo.languages_url);
          if (langResponse.ok) {
            const langData = await langResponse.json();
            languages = Object.keys(langData);
          }
        } catch {
          // Ignore language fetch errors
        }

        return {
          name: repo.name,
          description: repo.description,
          topics: repo.topics || [],
          languages,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          url: repo.html_url,
          lastUpdated: repo.updated_at,
          isForked: repo.fork,
        };
      })
    );

    // Calculate top languages
    const languageCounts: Record<string, number> = {};
    repos.forEach(repo => {
      repo.languages.forEach(lang => {
        languageCounts[lang] = (languageCounts[lang] || 0) + 1;
      });
    });
    const topLanguages = Object.entries(languageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang]) => lang);

    // Calculate total stars
    const totalStars = repos.reduce((sum, repo) => sum + repo.stars, 0);

    return {
      username,
      name: userData.name,
      avatarUrl: userData.avatar_url,
      bio: userData.bio,
      followers: userData.followers,
      following: userData.following,
      publicRepos: userData.public_repos,
      repos: repos.filter(r => !r.isForked), // Exclude forks
      topLanguages,
      totalStars,
      profileUrl: userData.html_url,
    };
  } catch (error) {
    console.error('GitHub fetch error:', error);
    return null;
  }
};

// Analyze GitHub profile for job matching
export const analyzeGitHubForJob = (
  profile: GitHubProfile,
  jobSkills: string[]
): {
  matchedSkills: string[];
  relevantRepos: GitHubRepo[];
  score: number;
} => {
  const normalizedJobSkills = jobSkills.map(s => s.toLowerCase());
  
  // Find matched skills from languages and topics
  const allProfileSkills = new Set<string>();
  profile.repos.forEach(repo => {
    repo.languages.forEach(lang => allProfileSkills.add(lang.toLowerCase()));
    repo.topics.forEach(topic => allProfileSkills.add(topic.toLowerCase()));
  });
  profile.topLanguages.forEach(lang => allProfileSkills.add(lang.toLowerCase()));
  
  const matchedSkills = normalizedJobSkills.filter(skill => 
    Array.from(allProfileSkills).some(ps => 
      ps.includes(skill) || skill.includes(ps)
    )
  );

  // Find relevant repos (those that match job skills)
  const relevantRepos = profile.repos.filter(repo => {
    const repoSkills = [...repo.languages, ...repo.topics].map(s => s.toLowerCase());
    return repoSkills.some(rs => 
      normalizedJobSkills.some(js => rs.includes(js) || js.includes(rs))
    );
  });

  // Calculate score (0-100)
  const skillMatchScore = (matchedSkills.length / Math.max(jobSkills.length, 1)) * 40;
  const repoScore = Math.min((relevantRepos.length / 5) * 30, 30);
  const activityScore = Math.min((profile.publicRepos / 10) * 15, 15);
  const qualityScore = Math.min((profile.totalStars / 20) * 15, 15);
  
  const score = Math.round(skillMatchScore + repoScore + activityScore + qualityScore);

  return {
    matchedSkills: matchedSkills.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
    relevantRepos,
    score: Math.min(score, 100),
  };
};
