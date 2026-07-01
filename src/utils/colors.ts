export function mixColors(a: string, b: string, t: number): string {
    const ca = hexToRgb(a)
    const cb = hexToRgb(b)

    return `rgb(${
        Math.round(ca.r + (cb.r - ca.r) * t)
    }, ${
        Math.round(ca.g + (cb.g - ca.g) * t)
    }, ${
        Math.round(ca.b + (cb.b - ca.b) * t)
    })`
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const normalized = hex.startsWith("#") ? hex.slice(1) : hex
  
    if (normalized.length !== 6) {
      throw new Error(`Invalid hex color: ${hex}`)
    }
  
    const value = Number.parseInt(normalized, 16)
  
    return {
      r: (value >> 16) & 0xff,
      g: (value >> 8) & 0xff,
      b: value & 0xff,
    }
  }