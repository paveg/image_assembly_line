import * as dockerUtil from '../src/docker-util'
import * as exec from '@actions/exec'

describe('latestBuiltImage()', () => {
  test('returns latest built image', async () => {
    const imageName = 'image_assembly_line/debug'
    const imageID = '63997a1b0d08'
    const imageLs = jest
      .spyOn(dockerUtil, 'imageLs')
      .mockImplementation(() =>
        Promise.resolve([
          `${imageName},latest,${imageID}`,
          `${imageName},v.1.1,${imageID}`,
          'image_assembly_line/debug,1.0,bb86086cce7c'
        ])
      )

    const builtImage = await dockerUtil.latestBuiltImage(imageName)
    expect(imageLs).toHaveBeenCalledWith(imageName)
    expect(builtImage.imageID).toEqual(imageID)
    expect(builtImage.imageName).toEqual(imageName)
    expect(builtImage.tags).toEqual(['latest', 'v.1.1']) // store tags for same ID
  })

  test('throw error if there is no built image', async () => {
    const imageName = 'image_assembly_line/debug'
    const imageLs = jest
      .spyOn(dockerUtil, 'imageLs')
      .mockImplementation(() => Promise.resolve([]))

    const result = dockerUtil.latestBuiltImage(imageName)
    await expect(result).rejects.toThrowError()
  })
})
