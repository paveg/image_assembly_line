import * as core from '@actions/core'
import Docker from './docker'
import {buildError, scanError, pushError} from './error'

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

    const noPush = core.getInput('no_push')
    core.debug(`no_push: ${noPush.toString()}`)

    const docker = new Docker(registry, imageName)
    core.debug(`docker: ${docker.toString()}`)

    await docker.build(target)

    await docker.scan()

    if (noPush.toString() === 'true') {
      core.info('no_push: true')
    } else {
      await docker.push()
    }
  } catch (e) {
    if (e instanceof buildError) {
      console.error('image build error');
    } else if (e instanceof scanError) {
      console.error('image scan error');
    } else if (e instanceof pushError) {
      console.error('ecr push error');
    } else {
      console.error('unknown error');
    }
    core.setFailed(e)
  }
}

run()
