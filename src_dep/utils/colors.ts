const rainbowColors = [
  "bg-rainbow-lime",
  "bg-rainbow-light-green",
  "bg-rainbow-teal",
  "bg-rainbow-cyan",
  "bg-rainbow-light-blue",
  "bg-rainbow-sky-blue",
  "bg-rainbow-blue",
  "bg-rainbow-indigo",
  "bg-rainbow-deep-purple",
  "bg-rainbow-purple",
  "bg-rainbow-magenta",
  "bg-rainbow-red",
  "bg-rainbow-orange",
  "bg-rainbow-amber",
  "bg-rainbow-yellow",
  "bg-rainbow-navy",
]

/**
 * Returns a random rainbow color class from the available list.
 * @param exclude An array of color class names to exclude (e.g., ["bg-rainbow-yellow"]).
 */
export function getRandomRainbowColor(exclude: string[] = []) {
  const availableColors = rainbowColors.filter((color) => !exclude.includes(color))
  const randomIndex = Math.floor(Math.random() * availableColors.length)
  return availableColors[randomIndex]
}

export function adjustOpacity(color: string, opacity: number): string {
  // Try to parse hex
  if (color.startsWith("#")) {
    let hex = color.replace("#", "")
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("")
    }
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      return `rgba(${r}, ${g}, ${b}, ${opacity})`
    }
    if (hex.length === 8) {
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      return `rgba(${r}, ${g}, ${b}, ${opacity})`
    }
  }

  // Try to parse rgba
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/)
  if (rgbaMatch) {
    return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${opacity})`
  }

  // Fallback for names or unknown formats (returns black with opacity as safe fallback)
  if (color === "transparent") {
    return "rgba(0, 0, 0, 0)"
  }

  if (color === "white") {
    return `rgba(255, 255, 255, ${opacity})`
  }

  if (color === "black") {
    return `rgba(0, 0, 0, ${opacity})`
  }

  // If we can't parse it (like oklch in some environments), we fallback to black with opacity
  // Note: For full oklch support, a more complex parser or a native css color-mix would be needed.
  return `rgba(0, 0, 0, ${opacity})`
}
