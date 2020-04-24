import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as im from '@actions/exec/lib/interfaces'
// import {spawnSync, SpawnSyncReturns} from 'child_process'

export default class Docker {
  private registry: string
  private imageName: string
  private _repository: string

  constructor(registry: string, imageName: string) {
    if (!registry) {
      throw new Error('registry is empty')
    }
    if (!imageName) {
      throw new Error('imageName is empty')
    }

    // remove the last '/'
    this.registry = sanitizedDomain(registry)
    this.imageName = imageName
    this._repository = `${this.registry}/${this.imageName}`
  }

  get repository(): string {
    return this._repository
  }

  async build(target: string): Promise<number> {
    try {
      const result = exec.exec('make', [
        `REGISTRY_NAME=${this.registry}`,
        `IMAGE_NAME=${this.imageName}`,
        target
      ])
      return result
    } catch (e) {
      core.debug('build() error')
      throw e
    }
  }

  private async login(): Promise<void> {
    core.debug('login()')

    // aws ecr get-login-password
    let ecrLoginPass = ''
    let ecrLoginError = ''
    const options: im.ExecOptions = {
      // set silent, not to log the password
      silent: true,
      listeners: {
        stdout: (data: Buffer) => {
          ecrLoginPass += data.toString()
        },
        stderr: (data: Buffer) => {
          ecrLoginError += data.toString()
        }
      }
    }
    try {
      await exec.exec('aws', ['ecr', 'get-login-password'], options)
    } catch (e) {
      core.error(ecrLoginError.trim())
      throw e
    }

    // docker login
    let stderr = ''
    try {
      options.ignoreReturnCode = true
      options.listeners = {
        stderr: (data: Buffer) => {
          stderr += data.toString()
        }
      }
      await exec.exec(
        'docker login',
        ['--username', 'AWS', '-p', ecrLoginPass, this.registry],
        options
      )
      core.debug('logged in')
    } catch (e) {
      core.error('login() failed')
      core.error(stderr)
      throw e
    }
  }

  async push(): Promise<number> {
    try {
      await this.login()
      const result = exec.exec('docker', ['image', 'push', this.repository])
      return result
    } catch (e) {
      core.error('push() error')
      throw e
    }
  }
}

function sanitizedDomain(str: string): string {
  return str.endsWith('/') ? str.substr(0, str.length - 1) : str
}
