import * as core from '@actions/core'
import ecr from 'aws-sdk/clients/ecr'

const client = new ecr({
  region: process.env.AWS_REGION
})

export async function getLatestImage(
  repositoryName: string
): Promise<ecr.ImageDetailList> {
  const params: ecr.Types.DescribeImagesRequest = {
    // eslint-disable-next-line object-shorthand
    repositoryName: repositoryName,
    imageIds: [
      {
        imageTag: 'latest'
      }
    ]
  }

  const images = await client.describeImages(params).promise()
  if (images.imageDetails) {
    core.debug(`repository name: ${images.imageDetails[0].repositoryName}`)
    return images.imageDetails
  } else {
    throw new Error('Image not found')
  }
}
