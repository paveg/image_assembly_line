import * as core from '@actions/core'
import {build} from './docker'

async function run(): Promise<void> {
  try {
    // REGISTRY_NAME はユーザー側から渡せない様にする
    const registry: string | undefined = process.env.REGISTRY_NAME
    if (registry === undefined) {
      throw new Error('REGISTRY_NAME is not set.')
    }
    core.debug(registry)

    const target = core.getInput('target')
    core.debug(`target: ${target}`)

    const imageName = core.getInput('image_name')
    core.debug(`image_name: ${imageName}`)

    await build(registry, imageName, target)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
