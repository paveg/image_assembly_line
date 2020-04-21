import * as core from '@actions/core'
import * as exec from '@actions/exec'

export async function build(
  registry: string,
  imageName: string,
  target: string
): Promise<number> {
  try {
    const result = await exec.exec(
      `make REGISTRY_NAME=${registry} IMAGE_NAME=${imageName} ${target}`
    )
    core.debug(`build(): ${result.toString()}`)
    return result
  } catch (e) {
    core.debug('build() error')
    throw e
  }
}
