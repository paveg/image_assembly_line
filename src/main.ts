import * as core from '@actions/core'
import Docker from './docker'
import {BuildError, ScanError, PushError} from './error'
import {setDelivery} from './deliver'
import * as notification from './notification'
import {Build} from './types'

async function run(): Promise<void> {
  try {
    // REGISTRY_NAME はユーザー側から渡せない様にする
    const registry: string | undefined = process.env.REGISTRY_NAME
    if (!registry) {
      throw new Error('REGISTRY_NAME is not set.')
    }
    core.debug(registry)
    if (process.env.GITHUB_TOKEN) {
      core.setSecret(process.env.GITHUB_TOKEN)
    }

    const target = core.getInput('target')
    core.debug(`target: ${target}`)

    const imageName = core.getInput('image_name')
    core.debug(`image_name: ${imageName}`)

    const severityLevel = core.getInput('severity_level')
    core.debug(`severity_level: ${severityLevel.toString()}`)

    const scanExitCode = core.getInput('scan_exit_code')
    core.debug(`scan_exit_code: ${scanExitCode.toString()}`)

    const noPush = core.getInput('no_push')
    core.debug(`no_push: ${noPush.toString()}`)

    const docker = new Docker(registry, imageName)
    core.debug(`docker: ${docker.toString()}`)

    await docker.build(target)

    await docker.scan(severityLevel, scanExitCode)

    if (noPush.toString() === 'true') {
      core.info('no_push: true')
    } else {
      await docker.push()
    }

    if (docker.builtImage && process.env.GITHUB_RUN_ID) {
      await setDelivery({
        dockerImage: docker.builtImage,
        gitHubRunID: process.env.GITHUB_RUN_ID
      })
    }
  } catch (e) {
    if (e instanceof BuildError) {
      core.error('image build error')
      const build: Build = {
        repository: process.env.GITHUB_REPOSITORY,
        workflow: process.env.GITHUB_WORKFLOW,
        commitSHA: process.env.GITHUB_SHA,
        actionID: process.env.GITHUB_ACTION
      }
      notification.notifyBuildFailed(build)
    } else if (e instanceof ScanError) {
      core.error('image scan error')
    } else if (e instanceof PushError) {
      core.error('ecr push error')
    } else {
      core.error('unknown error')
    }
    core.setFailed(e)
  }
}

run()
