import {Vulnerability} from './types'
import {postVulnerability} from './slack'
import {NotificationError} from './error'

export function notifyVulnerability(
  imageName: string,
  vulnerabilities: Vulnerability[]
): void {
  try {
    for (const result of vulnerabilities) {
      if (result.Vulnerabilities != null) {
        for (const vulnerability of result.Vulnerabilities) {
          postVulnerability(imageName, result.Target, vulnerability)
        }
      }
    }
    return
  } catch (e) {
    throw new NotificationError(e)
  }
}
