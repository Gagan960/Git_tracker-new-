// GitHub API service for fetching repository data
class GitHubService {
  constructor() {
    this.baseURL = "https://api.github.com";
    this.token = import.meta.env.VITE_GITHUB_TOKEN; // ✅ Vite-compatible env variable

    this.headers = {
      Accept: "application/vnd.github.v3+json",
    };

    if (this.token) {
      this.headers["Authorization"] = `token ${this.token}`;
      console.log("✅ Using GitHub token for API requests");
    } else {
      console.warn(
        "⚠️ No GitHub token found — using unauthenticated requests (rate limited to 60/hour)"
      );
    }

    // Simple in-memory cache to reduce duplicate requests during a session
    // key -> { ts, data }
    this._cache = new Map();
    this.CACHE_TTL = 1000 * 60 * 30; // 30 minutes
  }

  // 🧠 Helper: Delay for retry logic
  delay(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }

  // 🔍 Fetch repository total lines of code using faster languages endpoint
  async getRepositoryTotalLines(owner, repo) {
    try {
      // Use languages endpoint directly (much faster than stats)
      const bytes = await this.getRepositoryLOC(owner, repo);
      if (typeof bytes === 'number') {
        // Heuristic: average 40 bytes per line across languages
        return Math.max(0, Math.round(bytes / 40));
      }
      return null;
    } catch (err) {
      console.error(`⚠️ getRepositoryTotalLines Error:`, err.message);
      return null;
    }
  }

  // 💾 Fallback — get lines of code using /languages API
  async getRepositoryLOC(owner, repo) {
    try {
      const res = await fetch(`${this.baseURL}/repos/${owner}/${repo}/languages`, {
        headers: this.headers,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return Object.values(data).reduce((a, b) => a + b, 0);
    } catch (err) {
      console.error(`Error fetching LOC for ${owner}/${repo}:`, err.message);
      return null;
    }
  }

  // 📊 Preferable LOC via stats API (net additions - deletions)
  async getRepositoryLOCViaStats(owner, repo) {
    const url = `${this.baseURL}/repos/${owner}/${repo}/stats/code_frequency`;
    // The stats endpoints can take time to generate; poll a few times
    const maxAttempts = 6;
    const delayMs = 1500;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await fetch(url, { headers: this.headers });
        if (res.status === 202) {
          await this.delay(delayMs);
          continue;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
          await this.delay(delayMs);
          continue;
        }
        // Each item: [weekUnix, additions, deletions]
        const total = data.reduce((sum, [, add, del]) => sum + (add - del), 0);
        return Math.max(0, total);
      } catch (err) {
        // On network/API errors, try again a bit later
        await this.delay(delayMs);
      }
    }
    return null;
  }

  // ✅ Get rate limit info
  async getRateLimit() {
    try {
      const res = await fetch(`${this.baseURL}/rate_limit`, {
        headers: this.headers,
      });
      const data = await res.json();
      console.log("🔍 GitHub API Rate Limit:", data);
      return data;
    } catch (err) {
      console.error("Rate limit check failed:", err.message);
      return null;
    }
  }

  // 📈 Get commit count efficiently (using pagination link)
  // 📈 Get commit count efficiently and recent commit in a single request
  async getCommitSummary(owner, repo) {
    try {
      const res = await fetch(
        `${this.baseURL}/repos/${owner}/${repo}/commits?per_page=1`,
        { headers: this.headers }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const link = res.headers.get("Link");
      let totalCommits = 0;
      if (link) {
        const match = link.match(/page=(\d+)>; rel="last"/);
        totalCommits = match ? parseInt(match[1]) : 1;
      }

      const commits = await res.json();
      if (!commits || commits.length === 0) return { totalCommits: 0, recentCommit: null };

      const commit = commits[0];
      const recentCommit = {
        message: commit.commit.message,
        date: commit.commit.author.date,
        author: commit.commit.author.name,
        sha: commit.sha.substring(0, 7),
        url: commit.html_url,
      };

      // If Link header didn't give a page count, fallback to commits.length
      if (!totalCommits) totalCommits = commits.length;

      return { totalCommits, recentCommit };
    } catch (err) {
      console.error(`Error fetching commit summary for ${owner}/${repo}:`, err.message);
      return { totalCommits: 0, recentCommit: null };
    }
  }

  // 🕒 Get latest commit details
  // (kept for backward compatibility but not used by getRepositoryData)
  async getRecentCommit(owner, repo) {
    try {
      const res = await fetch(
        `${this.baseURL}/repos/${owner}/${repo}/commits?per_page=1`,
        { headers: this.headers }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const commits = await res.json();
      if (!commits.length) return null;

      const commit = commits[0];
      return {
        message: commit.commit.message,
        date: commit.commit.author.date,
        author: commit.commit.author.name,
        sha: commit.sha.substring(0, 7),
        url: commit.html_url,
      };
    } catch (err) {
      console.error(`Error fetching recent commit:`, err.message);
      return null;
    }
  }

  // 📦 Fetch repository information
  async getRepositoryInfo(owner, repo) {
    try {
      const res = await fetch(`${this.baseURL}/repos/${owner}/${repo}`, {
        headers: this.headers,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      return {
        name: data.name,
        description: data.description,
        language: data.language,
        stars: data.stargazers_count,
        forks: data.forks_count,
        size: data.size,
        updatedAt: data.updated_at,
        createdAt: data.created_at,
        isPrivate: data.private,
      };
    } catch (err) {
      console.error(`Error fetching repo info:`, err.message);
      return null;
    }
  }

  // 🔗 Extract owner & repo name from a GitHub URL
  extractRepoInfo(githubUrl) {
    try {
      let url = githubUrl.trim();
      if (url.endsWith(".git")) url = url.slice(0, -4);
      if (!url.startsWith("http")) url = `https://github.com/${url}`;
      const { pathname } = new URL(url);
      const [owner, repo] = pathname.split("/").filter(Boolean);
      return owner && repo ? { owner, repo } : null;
    } catch {
      return null;
    }
  }

  // 🧩 Combine everything
  // githubUrl: repo URL or owner/repo string
  // options: { skipLOC: boolean } - set skipLOC=true for faster bulk loads
  async getRepositoryData(githubUrl, { skipLOC = true } = {}) {
    const repoInfo = this.extractRepoInfo(githubUrl);
    if (!repoInfo) return { error: "Invalid GitHub URL" };

    const key = `${repoInfo.owner}/${repoInfo.repo}:${skipLOC ? 'noloc' : 'loc'}`;
    const cached = this._cache.get(key);
    if (cached && Date.now() - cached.ts < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      // combine commits summary into single call (commit count + recent commit)
      const commitPromise = this.getCommitSummary(repoInfo.owner, repoInfo.repo);
      const infoPromise = this.getRepositoryInfo(repoInfo.owner, repoInfo.repo);
      const promises = [commitPromise, infoPromise];

      if (!skipLOC) {
        promises.push(this.getRepositoryTotalLines(repoInfo.owner, repoInfo.repo));
      }

      const results = await Promise.all(promises);

      const [commitSummary, repositoryInfo, totalLinesOfCode] = results;
      const totalCommits = commitSummary?.totalCommits || 0;
      const recentCommit = commitSummary?.recentCommit || null;

      const result = {
        totalCommits,
        recentCommit,
        repositoryInfo,
        totalLinesOfCode: typeof totalLinesOfCode === 'number' ? totalLinesOfCode : null,
        error: null,
      };

      this._cache.set(key, { ts: Date.now(), data: result });

      return result;
    } catch (err) {
      console.error("Error in getRepositoryData:", err.message);
      return { error: err.message };
    }
  }

  // Invalidate cache for a specific repo (owner/repo) or clear all
  invalidateRepoCache(owner, repo) {
    const keyLoc = `${owner}/${repo}:loc`;
    const keyNoLoc = `${owner}/${repo}:noloc`;
    this._cache.delete(keyLoc);
    this._cache.delete(keyNoLoc);
  }

  clearCache() {
    this._cache.clear();
  }

  // ✅ Validate username exists
  async validateUsername(username) {
    try {
      const res = await fetch(`${this.baseURL}/users/${username}`, {
        headers: this.headers,
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

export default new GitHubService();
