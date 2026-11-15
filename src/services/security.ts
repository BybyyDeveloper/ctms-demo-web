// Utilitas keamanan sisi-klien (Web Crypto). Catatan: tanpa server, ini memperkuat tetapi tidak menggantikan keamanan backend.
const enc = new TextEncoder()
const ITER = 600_000 // rekomendasi OWASP untuk PBKDF2-HMAC-SHA256
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u))
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
async function derive(pw: string, salt: Uint8Array, iter: number) {
  const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits'])
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256))
}
const same = (a: Uint8Array, b: Uint8Array) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i]; return d === 0 }
export async function hashPassword(pw: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return `pbkdf2$${ITER}$${b64(salt)}$${b64(await derive(pw, salt, ITER))}`
}
export async function verifyPassword(pw: string, stored: string) {
  const [t, it, s, h] = stored.split('$')
  if (t !== 'pbkdf2' || !it || !s || !h) return false
  return same(await derive(pw, unb64(s), Number(it)), unb64(h))
}
let dummy: Promise<string> | null = null
/** Menyamakan waktu respons saat email tidak ditemukan (mengurangi user enumeration). */
export const dummyVerify = async (pw: string) => { dummy = dummy || hashPassword('dummy-password-1'); await verifyPassword(pw, await dummy) }
export const pwIssue = (pw: string) => (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw) ? 'Password must be at least 8 characters and include a letter and a number' : null)
