import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as im from '@actions/exec/lib/interfaces'
// import {spawnSync, SpawnSyncReturns} from 'child_process'

export default class Docker {
  private registry: string
  private imageName: string
  private repository: string
  constructor(registry: string, imageName: string) {
    if (!registry) {
      throw new Error('registry is empty')
    }
    if (!imageName) {
      throw new Error('imageName is empty')
    }

    this.registry = registry
    this.imageName = imageName
    this.repository = getRepository(this.registry, this.imageName)
  }

  async build(target: string): Promise<number> {
    try {
      const result = exec.exec(
        `make REGISTRY_NAME=${this.registry} IMAGE_NAME=${this.imageName} ${target}`
      )
      return result
    } catch (e) {
      core.debug('build() error')
      throw e
    }
  }

  async tag(tags: string[]): Promise<number> {
    if (tags.length === 0) {
      return 0
    }

    let argline = ''
    for (const tag of tags) {
      argline += ' -t '
      argline += tag
    }

    try {
      return await exec.exec(`docker tag ${this.repository} ${argline}`)
    } catch (e) {
      core.debug('tag() error')
      throw e
    }
  }

  async login(): Promise<void> {
    core.debug('login()')
    let ecrLoginPass = ''
    let ecrLoginError = ''

    const options: im.ExecOptions = {}
    options.silent = true
    options.listeners = {
      stdout: (data: Buffer) => {
        ecrLoginPass += data.toString()
      },
      stderr: (data: Buffer) => {
        ecrLoginError += data.toString()
      }
    }
    await exec.exec('aws', ['ecr', 'get-login-password'], options)

    core.setSecret('ecrLoginPass')
    core.saveState('ecrLoginPass', ecrLoginPass)
    core.debug(ecrLoginError)

    await exec.exec(
      'docker login',
      ['--username', 'AWS', '-p', core.getState('ecrLoginPass'), this.registry],
      {silent: true}
    )
  }

  async push(): Promise<number> {
    try {
      await this.login()
      const result = await exec.exec(`docker image push ${this.repository}`)
      return result
    } catch (e) {
      core.debug('push() error')
      throw e
    }
  }
}

function getRepository(registry: string, imageName: string): string {
  if (registry.endsWith('/')) {
    return `${registry}${imageName}`
  } else {
    return `${registry}/${imageName}`
  }
}
