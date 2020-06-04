import * as slack from '../src/slack'
import * as types from '@slack/types'

if (!process.env.SLACK_CICD_NOTIFICATION_TEST) {
  throw new Error('')
}
const channel = process.env.SLACK_CICD_NOTIFICATION_TEST

describe('postMessage', () => {
  test('post simple message', async () => {
    const result = await slack.postMessage(channel, 'test message')

    expect(result.ok).toBe(true)
    expect(result.channel).toBe(channel)
  })

  test('post message with attachment', async () => {
    const attachment = {
      color: 'danger',
      title: 'ATTACHMENT TITLE',
      fields: [
        {type: 'mrkdwn', title: 'field1', value: '*val1*'},
        {title: 'field2', value: 'val2'},
        {title: 'field3', value: 'val3'},
        {title: 'field4', value: 'val4'}
      ]
    } as types.MessageAttachment

    const result = await slack.postMessage(channel, '*test message*', [
      attachment
    ])

    const message = result.message as any
    expect(result.ok).toBe(true)
    expect(message.attachments).toHaveLength(1)
  })
})

describe('postVulnerability()', () => {
  test('Post message to CSIRT', async () => {
    const imageName = 'test/app:latest'
    const target = 'alpine:3.x.x (alpine 3.x.x)'
    const cve = {
      VulnerabilityID: 'CVE-2020-0000',
      PkgName: 'test',
      InstalledVersion: '1.0.0',
      FixedVersion: '1.0.1',
      Severity: 'CRITICAL'
    }

    process.env.SLACK_TRIVY_ALERT = process.env.SLACK_CICD_NOTIFICATION_TEST
    const result = await slack.postVulnerability(imageName, target, cve)
    expect(result.ok).toBe(true)
  })
})
