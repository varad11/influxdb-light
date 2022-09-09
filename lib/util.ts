/**
 * Return base64 encoded string
 * @param creds : string eg.: username:password
 * @returns 
 */
 export function toBase64(creds: string) {
    const buffer = Buffer.from(creds);
    return buffer.toString("base64")
}