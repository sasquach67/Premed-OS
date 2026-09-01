const target = process.argv[2] || process.env.PREMEDOS_PRODUCTION_URL || 'https://premedos.app/'

const requiredHeaders = {
  'content-security-policy': (value) => value.includes("default-src 'self'") && value.includes("object-src 'none'"),
  'strict-transport-security': (value) => /max-age=\d+/.test(value),
  'referrer-policy': (value) => value.toLowerCase().includes('strict-origin-when-cross-origin'),
  'permissions-policy': (value) => value.includes('camera=()') && value.includes('microphone=()'),
  'x-content-type-options': (value) => value.toLowerCase() === 'nosniff',
}

let response
try {
  response = await fetch(target, { redirect: 'follow' })
} catch (error) {
  console.error(`Could not reach ${target}: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}

const failures = []
if (!response.ok) failures.push(`HTTP ${response.status}`)
if (!response.url.startsWith('https://')) failures.push(`final URL is not HTTPS: ${response.url}`)

for (const [name, validates] of Object.entries(requiredHeaders)) {
  const value = response.headers.get(name)
  if (!value) failures.push(`${name} is missing`)
  else if (!validates(value)) failures.push(`${name} has an unexpected value: ${value}`)
}

if (failures.length) {
  console.error(`Production security verification failed for ${response.url}:`)
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`Production security headers verified for ${response.url}.`)
