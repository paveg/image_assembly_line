export interface Repository {
  name: string
  url: string
}

export interface VulnerabilityIssue {
  level: string
  name: string
  cve: string
}

export interface Vulnerability {
  Target: string
  Vulnerabilities: CVE[] | null
}

interface CVE {
  VulnerabilityID: string
  PkgName: string
  InstalledVersion: string
  FixedVersion: string
  Severity: string
}
