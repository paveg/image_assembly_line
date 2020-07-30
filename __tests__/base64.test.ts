import {base64} from '../src/base64'

const ORIG_TEXT = 'test'
const ENCODED_TEXT = 'dGVzdA=='

describe('encode()', () => {
  test('returns correctly value', () => {
    const encoded = base64.encode(ORIG_TEXT)
    expect(encoded).toEqual(ENCODED_TEXT)
  })
})
describe('decode()', () => {
  test('returns correctly value', () => {
    const decoded = base64.decode(ENCODED_TEXT)
    expect(decoded).toEqual(ORIG_TEXT)
  })
})
