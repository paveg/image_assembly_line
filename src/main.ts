import * as core from '@actions/core'
import Docker from './docker'
import {BuildError, ScanError, PushError} from './error'
import {setDelivery} from './deliver'
import * as notification from './notification'
import * as s3 from './s3'
import {BuildAction} from './types'

async function run(): Promise<void> {
  const thisAction = new BuildAction({
    repository: process.env.GITHUB_REPOSITORY,
    workflow: process.env.GITHUB_WORKFLOW,
    commitSHA: process.env.GITHUB_SHA,
    runID: process.env.GITHUB_RUN_ID
  })

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

    const startTime = new Date() // UTC

    const target = core.getInput('target')
    core.debug(`target: ${target}`)

    const imageName = core.getInput('image_name')
    core.debug(`image_name: ${imageName}`)

    if (!process.env.GITHUB_SHA) {
      throw new Error('GITHUB_SHA not found.')
    }
    const commitHash = process.env.GITHUB_SHA
    core.debug(`commit_hash: ${commitHash}`)

    const severityLevel = core.getInput('severity_level')
    core.debug(`severity_level: ${severityLevel.toString()}`)

    const scanExitCode = core.getInput('scan_exit_code')
    core.debug(`scan_exit_code: ${scanExitCode.toString()}`)

    const noPush = core.getInput('no_push')
    core.debug(`no_push: ${noPush.toString()}`)

    const docker = new Docker(registry, imageName, commitHash)
    core.debug(`docker: ${docker.toString()}`)

    await docker.build(target)

    await docker.scan(severityLevel, scanExitCode)

    if (docker.builtImage && process.env.GITHUB_RUN_ID) {
      if (noPush.toString() === 'true') {
        core.info('no_push: true')
      } else {
        for (const tag of docker.builtImage.tags) {
          await docker.push(tag)
        }
      }
      await setDelivery({
        dockerImage: docker.builtImage,
        gitHubRunID: process.env.GITHUB_RUN_ID
      })
    }

    const endTime = new Date() // UTC
    s3.uploadBuildTime(startTime, endTime)

    const elapsedSec = (endTime.getTime() - startTime.getTime()) / 1000
    const buildTime = `${Math.floor(elapsedSec/60)}min ${elapsedSec%60}sec`
    notification.notifyReadyToDeploy(thisAction, imageName, buildTime, docker.builtImage?.tags.join(", "))
  } catch (e) {
    if (e instanceof BuildError) {
      core.error('image build error')
      notification.notifyBuildFailed(thisAction)
    } else if (e instanceof ScanError) {
      core.error('image scan error')
    } else if (e instanceof PushError) {
      core.error('ecr push error')
    } else {
      core.error(e.message)
      core.error('unknown error')
    }
    core.setFailed(e)
  }
}

run()
