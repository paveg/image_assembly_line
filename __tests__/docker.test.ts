import {build} from '../src/docker'

test('build', async () => {
  // 成功して結果が 0 であること
  expect(
    await build(
      '1234567890.dkr.ecr.ap-northeast-1.amazonaws.com/',
      'imagename/app',
      'build'
    )
  ).toEqual(0)
})
