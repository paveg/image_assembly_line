export interface Repository {
  name: string
  url: string
}

export interface Vulnerability {
  Target: string
  Vulnerabilities: CVE[] | null
}

export interface CVE {
  VulnerabilityID: string
  PkgName: string
  InstalledVersion: string
  FixedVersion: string
  Severity: string
}
