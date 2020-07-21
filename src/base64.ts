import {Buffer} from 'buffer'

export const base64 = {
  encode: (str: string) => {
    return Buffer.from(str).toString('base64')
  },
  // for debug function
  decode: (str: string) => {
    return Buffer.from(str, 'base64').toString()
  }
}
