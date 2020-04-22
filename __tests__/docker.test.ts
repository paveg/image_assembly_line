import Docker from '../src/docker'
import {defaultCoreCipherList} from 'constants'
import {createHash} from 'crypto'
import * as exec from '@actions/exec'
import {resolve} from 'dns'

describe('constructor', () => {
  test('registry and imageName is given', async () => {
    expect(
      new Docker(
        '1234567890.dkr.ecr.ap-northeast-1.amazonaws.com/',
        'imagename/app'
      )
    ).toBeInstanceOf(Docker)
  })

  test('registry is empty', () => {
    expect(() => {
      new Docker('', 'imagename/app')
    }).toThrowError()
  })
})

describe('Docker#build()', () => {
  const docker = new Docker(
    '1234567890.dkr.ecr.ap-northeast-1.amazonaws.com/',
    'imagename/app'
  )

  test('build', async () => {
    // 成功して結果が 0 であること
    expect(await docker.build('build')).toEqual(0)
  })
})
