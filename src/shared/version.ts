/** Parses `1.2.3` or `v1.2.3` into numbers; null when it is not a plain semver core. */
function parse(version: string): [number, number, number] | null {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(version.trim())
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null
}

/** True when `candidate` is a newer release than `current`. Unparsable versions are never newer. */
export function isNewer(candidate: string, current: string): boolean {
  const a = parse(candidate)
  const b = parse(current)
  if (!a || !b) return false
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i]
  }
  return false
}
