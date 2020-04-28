import {DockerImage} from './docker'
import * as exec from '@actions/exec'
import * as core from '@actions/core'

enum DockerFormat {
  repository = 0,
  tag = 1,
  id = 2
}

export async function latestBuiltImage(
  imageName: string
): Promise<DockerImage> {
  core.debug('latestBuiltImage()')
  const imageLines = await exports.imageLs(imageName)
  if (imageLines.length < 1) {
    throw new Error('No images built')
  }

  let builtImageName = ''
  let builtImageID = ''

  const tags = []
  for (const imageLineStr of imageLines) {
    const imageLine = imageLineStr.split(',')
    if (!builtImageName && !builtImageID) {
      builtImageName = imageLine[DockerFormat.repository]
      builtImageID = imageLine[DockerFormat.id]
    } else if (builtImageID !== imageLine[DockerFormat.id]) {
      break
    }

    tags.push(imageLine[DockerFormat.tag])
  }

  return {
    imageName: builtImageName,
    imageID: builtImageID,
    tags
  }
}

export async function imageLs(imageName: string): Promise<string[]> {
  core.debug(`imageLs(): ${imageName}`)
  let stdout = ''
  await exec.exec(
    'docker',
    ['image', 'ls', `--format`, '{{.Repository}},{{.Tag}},{{.ID}}'],
    {
      listeners: {
        stdout: (data: Buffer) => {
          stdout += data.toString()
        }
      }
    }
  )
  const result = stdout
    .split('\n')
    .filter(line => line.startsWith(`${imageName},`))
  core.debug(`filtered: ${result.toString()}`)
  return result
}

// Return true when check is OK
export async function noBuiltImage(): Promise<boolean> {
  let stdout = ''

  await exec.exec('docker', ['image', 'ls', '-q'], {
    listeners: {
      stdout: (data: Buffer) => {
        stdout += data.toString()
      }
    }
  })

  const imageCount = stdout.split('\n').filter(word => !!word).length

  core.debug(`built image count: ${imageCount}`)
  if (imageCount > 0) {
    return false
  } else {
    return true
  }
}

export async function imageTag(source: string, target: string): Promise<void> {
  await exec.exec('docker', ['image', 'tag', source, target])
}
