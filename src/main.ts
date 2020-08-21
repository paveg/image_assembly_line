import * as core from '@actions/core'
import Docker from './docker'
import {BuildError, ScanError, PushError, TaggingError} from './error'
import {setDelivery} from './deliver'
import * as notification from './notification'
import * as s3 from './s3'
import {BuildAction} from './types'
import Bugsnag from '@bugsnag/js'

async function run(): Promise<void> {
  const startTime = new Date() // UTC
  const env = process.env
  const gitHubRepo = env.GITHUB_REPOSITORY
  const gitHubWorkflow = env.GITHUB_WORKFLOW
  const commitHash = env.GITHUB_SHA
  const gitHubRunID = env.GITHUB_RUN_ID

  const thisAction = new BuildAction({
    repository: gitHubRepo,
    workflow: gitHubWorkflow,
    commitSHA: commitHash,
    runID: gitHubRunID
  })

  const bugsnagApiKey: string | undefined = env.BUGSNAG_API_KEY
  // REGISTRY_NAME はユーザー側から渡せない様にする
  const registry: string | undefined = env.REGISTRY_NAME
  try {
    if (!registry) {
      throw new Error('REGISTRY_NAME is not set.')
    }
    if (!commitHash) {
      throw new Error('GITHUB_SHA not found.')
    }
    if (!bugsnagApiKey) {
      throw new Error('BUGSNAG_API_KEY not found.')
    }
    Bugsnag.start({
      apiKey: bugsnagApiKey,
      enabledReleaseStages: ['production'],
      appType: 'image_assembly_line',
      releaseStage: env.CONTAINERKOJO_ENV,
      metadata: {
        actionInformation: {
          repository: gitHubRepo,
          workflow: gitHubWorkflow,
          commitSHA: commitHash,
          runID: gitHubRunID
        }
      }
    })
    if (env.GITHUB_TOKEN) {
      core.setSecret(env.GITHUB_TOKEN)
    }

    const target = core.getInput('target')
    const imageName = core.getInput('image_name')
    const severityLevel = core.getInput('severity_level')
    const scanExitCode = core.getInput('scan_exit_code')
    const noPush = core.getInput('no_push')

    const docker = new Docker(registry, imageName, commitHash)
    Bugsnag.addMetadata('buildDetails', {
      builtImage: docker.builtImage,
      noPush
    })

    core.debug(`[INFORMATION]
      registry: ${registry}
      target: ${target}
      image_name: ${imageName}
      commit_hash: ${commitHash}
      severity_level: ${severityLevel.toString()}
      scan_exit_code: ${scanExitCode.toString()}
      no_push: ${noPush.toString()}
      docker: ${JSON.stringify(docker)}`)
    await docker.build(target, noPush.toString())

    await docker.scan(severityLevel, scanExitCode)

    if (docker.builtImage && gitHubRunID) {
      if (noPush.toString() === 'true') {
        core.info('no_push: true')
      } else {
        const upstreamRepo = docker.upstreamRepository()
        for (const tag of docker.builtImage.tags) {
          Bugsnag.addMetadata('buildDetails', {
            tag,
            upstreamRegistry: upstreamRepo
          })
          await docker.tag(tag, upstreamRepo)
          await docker.push(tag, upstreamRepo)
        }
      }
      await setDelivery({
        dockerImage: docker.builtImage,
        gitHubRunID
      })
    }

    const endTime = new Date() // UTC
    s3.uploadBuildTime(startTime, endTime, imageName, 'success', 'NoError')

    const elapsedSec = (endTime.getTime() - startTime.getTime()) / 1000
    const buildTime = `${Math.floor(elapsedSec / 60)}min ${elapsedSec % 60}sec`
    notification.notifyReadyToDeploy(
      thisAction,
      imageName,
      buildTime,
      docker.builtImage?.tags.join(', ')
    )
  } catch (e) {
    let errorReason: string
    if (e instanceof BuildError) {
      errorReason = 'BuildError'
      core.error('image build error')
      notification.notifyBuildFailed(thisAction)
    } else if (e instanceof ScanError) {
      errorReason = 'ScanError'
      core.error('image scan error')
    } else if (e instanceof TaggingError) {
      errorReason = 'TaggingError'
      core.error('image tagging error')
    } else if (e instanceof PushError) {
      errorReason = 'PushError'
      core.error('ecr push error')
    } else {
      errorReason = 'UnknownError'
      core.error(e.message)
      core.error('unknown error')
    }

    Bugsnag.addMetadata('errorDetails', {reason: errorReason})
    Bugsnag.notify(e)
    const endTime = new Date() // UTC
    const imageName = core.getInput('image_name')
    s3.uploadBuildTime(startTime, endTime, imageName, 'fail', errorReason)

    core.setFailed(e)
  }
}

run()
