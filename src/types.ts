export interface Repository {
  name: string
  url: string
}

export interface VulnerabilityIssue {
  level: string
  name: string
  cve: string
}

export interface Build {
  repository?: string
  workflow?: string
  commitSHA?: string
  actionID?: string
}
