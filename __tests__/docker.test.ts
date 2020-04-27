import {Docker, dockerLs} from '../src/docker'
import {defaultCoreCipherList} from 'constants'
import * as exec from '@actions/exec'

jest.mock('@actions/exec');

describe('constructor', () => {
  test('registry and imageName is given', async () => {
    const docker = new Docker(
      '1234567890.dkr.ecr.ap-northeast-1.amazonaws.com',
      'imagename/app'
    )
    expect(docker).toBeInstanceOf(Docker)
    expect(docker.repository).toEqual(
      '1234567890.dkr.ecr.ap-northeast-1.amazonaws.com/imagename/app'
    )
  })

  test('registry is empty', () => {
    expect(() => {
      new Docker('', 'imagename/app')
    }).toThrowError()
  })

  test('registry ends with /', () => {
    const docker = new Docker(
      '1234567890.dkr.ecr.ap-northeast-1.amazonaws.com/',
      'imagename/app'
    )
    expect(docker.repository).toEqual(
      '1234567890.dkr.ecr.ap-northeast-1.amazonaws.com/imagename/app'
    )
  })
})

describe('Docker#build()', () => {
  const docker = new Docker(
    '1234567890.dkr.ecr.ap-northeast-1.amazonaws.com/',
    'imagename/app'
  )

  test('build', async () => {
    exec.exec.mockResolvedValue(0)
    // 成功して結果が 0 であること
    expect(await docker.build('build')).toEqual(0)
  })
})
