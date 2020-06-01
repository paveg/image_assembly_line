import {NotificationError} from './error'
import * as slack from './slack'
import {Build} from './types'

export function notifyVulnerability(): void {
  try {
    // slack.postMessage()
    return
    // eslint-disable-next-line no-unreachable
  } catch (e) {
    throw new NotificationError(e)
  }
}

/*
 *
 */
export async function notifyBuildFailed(build: Build): Promise<void> {
  slack.postBuildFailed(build)
}
