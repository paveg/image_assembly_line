import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as im from '@actions/exec/lib/interfaces'
// import {spawnSync, SpawnSyncReturns} from 'child_process'

jest.mock('@actions/exec')
export default class Docker {
  private registry: string
  private imageName: string
  private builtImage?: DockerImage

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
  }

  async build(target: string): Promise<DockerImage> {
    try {
      if (!(await noBuiltImage())) {
        throw new Error('Built image exists')
      }
      await exec.exec('make', [
        `REGISTRY_NAME=${this.registry}`,
        `IMAGE_NAME=${this.imageName}`,
        target
      ])

      return this.update()
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
      const result = exec.exec('docker', [
        'image',
        'push',
        this.upstreamRepository()
      ])
      return result
    } catch (e) {
      core.error('push() error')
      throw e
    }
  }

  upstreamRepository(): string {
    ;`${this.registry}/${this.builtImage.imageName}`
  }

  private async update(): Promise<DockerImage> {
    this.builtImage = await latestBuiltImage(this.imageName)
    return this.builtImage
  }
}

function sanitizedDomain(str: string): string {
  return str.endsWith('/') ? str.substr(0, str.length - 1) : str
}

// Return true when check is OK
async function noBuiltImage(): Promise<boolean> {
  let stdout = ''
  const options: im.ExecOptions = {
    // set silent, not to log the password
    silent: true,
    listeners: {
      stdout: (data: Buffer) => {
        stdout += data.toString()
      }
    }
  }
  await exec.exec('docker', ['image', 'ls', '-q'], options)

  const imageCount = stdout.split('\n').length

  if (imageCount > 0) {
    return false
  } else {
    return true
  }
}

interface DockerImage {
  imageID: string
  imageName: string
  tags: string[]
}

async function latestBuiltImage(imageName: string): Promise<DockerImage> {
  enum DockerFormat {
    repository = 0,
    tag = 1,
    id = 2
  }

  let stdout = ''
  await exec.exec(
    'docker',
    [
      'image',
      'ls',
      `--filter=reference='${imageName}'`,
      `--format`,
      '{{.Repository}},{{.Tag}},{{.ID}}'
    ],
    {
      listeners: {
        stdout: (data: Buffer) => {
          stdout += data.toString()
        }
      }
    }
  )
  const imageLines = stdout.split('\n')
  if (imageLines.length < 1) {
    throw new Error('No images built')
  }

  let tags = []
  for (const imageLine of imageLines) {
    tags.push(imageLine[DockerFormat.tag])
  }
  return {
    imageName: imageLines[0][DockerFormat.repository],
    imageID: imageLines[0][DockerFormat.id],
    tags
  }
}
