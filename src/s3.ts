import * as core from '@actions/core'
import s3 from 'aws-sdk/clients/s3'
import {v4 as uuidv4} from 'uuid'
import * as ecr from './ecr'

const client = new s3({
  region: process.env.AWS_REGION
})

export async function uploadVulnerability(rowJson: string): Promise<void> {
  if (!process.env.LOGS_BUCKET_NAME) {
    throw new Error('No bucket name.')
  }
  const bucketName: string = process.env.LOGS_BUCKET_NAME

  const json: string = convertToJsonLines(rowJson)
  core.debug(`JSON data: ${json}`)

  const param: s3.Types.PutObjectRequest = {
    Bucket: bucketName,
    Key: generateObjectKey('trivy/', 'json'),
    Body: json,
    ContentType: 'application/json',
    ACL: 'bucket-owner-full-control'
  }

  s3PutObject(param)
}

export async function uploadBuildTime(
  startTime: Date,
  endTime: Date,
  registry: string,
  repositoryName: string,
  buildResult: string,
  buildReason: string
): Promise<void> {
  if (!process.env.METRICS_BUCKET_NAME) {
    throw new Error('No bucket name.')
  }
  const bucketName: string = process.env.METRICS_BUCKET_NAME
  const registryId: string = registry.split('.')[0]

  const latestImage = await ecr.getLatestImage(repositoryName, registryId)
  if (!latestImage[0].imagePushedAt) {
    throw new Error('No push date.')
  }
  const imagePushedAt = latestImage[0].imagePushedAt

  /* eslint-disable @typescript-eslint/camelcase */
  const buildData = {
    start_at: convertDateTimeFormat(startTime),
    end_at: convertDateTimeFormat(endTime),
    repository: process.env.GITHUB_REPOSITORY,
    branch: process.env.GITHUB_REF,
    run_id: process.env.GITHUB_RUN_ID,
    pushed_at: convertDateTimeFormat(imagePushedAt),
    result: buildResult,
    reason: buildReason
  }
  /* eslint-enable */

  const json = `${JSON.stringify(buildData)}\n`
  core.debug(`JSON data: ${json}`)

  const param: s3.Types.PutObjectRequest = {
    Bucket: bucketName,
    Key: generateObjectKey('buildtime/dt=', 'json'),
    Body: json,
    ContentType: 'application/json'
  }

  s3PutObject(param)
}

export async function s3PutObject(
  param: s3.Types.PutObjectRequest
): Promise<void> {
  client.upload(param, (err: Error, data: s3.ManagedUpload.SendData) => {
    if (err) {
      throw new Error('Failed to upload to S3.')
    } else {
      core.debug(`Upload to S3: ${data.Bucket}/${data.Key}`)
    }
  })
}

function generateObjectKey(prefix: string, fileExtension: string): string {
  const now = new Date() // UTC
  const year = now.getFullYear()
  const month = zeroPadding(now.getMonth() + 1, 2)
  const date = zeroPadding(now.getDate(), 2)
  const hour = zeroPadding(now.getHours(), 2)
  const minute = zeroPadding(now.getMinutes(), 2)
  const second = zeroPadding(now.getSeconds(), 2)

  const objectKey = `${year}-${month}-${date}/${hour}-${minute}-${second}-${uuidv4()}`
  return `${prefix}${objectKey}.${fileExtension}`
}

function zeroPadding(num: number, len: number): string {
  return num.toString().padStart(len, '0')
}

function convertToJsonLines(json: string): string {
  json = JSON.stringify(JSON.parse(json))
  return `${json}\n`
}

function convertDateTimeFormat(date: Date): string {
  return date
    .toISOString()
    .replace('T', ' ')
    .replace('Z', '')
}
