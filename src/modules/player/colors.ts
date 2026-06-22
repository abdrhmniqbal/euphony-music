import { getColors } from "react-native-image-colors"

import { logWarn } from "@/modules/logging/service"

import {
  type ColorPalette,
  getCurrentImageUriState,
  getDefaultPlayerColors,
  setCurrentColorsState,
  setCurrentImageUriState,
  setIsLoadingColorsState,
} from "./colors-store"

const colorCache = new Map<string, ColorPalette>()

function getStringProperty(source: unknown, key: string): string | null {
  if (!source || typeof source !== "object") {
    return null
  }

  const value = (source as Record<string, unknown>)[key]
  return typeof value === "string" && value.length > 0 ? value : null
}

function resolveAndroidColors(result: unknown, fallbackColors: ColorPalette): ColorPalette {
  return {
    bg: getStringProperty(result, "average") || fallbackColors.bg,
    primary: getStringProperty(result, "dominant") || fallbackColors.primary,
    secondary: getStringProperty(result, "darkVibrant") || fallbackColors.secondary,
  }
}

function resolveIOSColors(result: unknown, fallbackColors: ColorPalette): ColorPalette {
  return {
    bg: getStringProperty(result, "background") || fallbackColors.bg,
    primary: getStringProperty(result, "primary") || fallbackColors.primary,
    secondary: getStringProperty(result, "detail") || fallbackColors.secondary,
  }
}

function resolveWebColors(result: unknown, fallbackColors: ColorPalette): ColorPalette {
  return {
    bg:
      getStringProperty(result, "background") ||
      getStringProperty(result, "average") ||
      fallbackColors.bg,
    primary:
      getStringProperty(result, "dominant") ||
      getStringProperty(result, "primary") ||
      fallbackColors.primary,
    secondary:
      getStringProperty(result, "vibrant") ||
      getStringProperty(result, "detail") ||
      fallbackColors.secondary,
  }
}

export async function getTrackColors(imageUri: string): Promise<ColorPalette> {
  const cachedColors = colorCache.get(imageUri)
  if (cachedColors) {
    return cachedColors
  }

  const fallbackColors = getDefaultPlayerColors()

  try {
    const result = await getColors(imageUri, {
      fallback: fallbackColors.bg,
      cache: true,
      key: imageUri,
    })

    const colors =
      result.platform === "android"
        ? resolveAndroidColors(result, fallbackColors)
        : result.platform === "ios"
          ? resolveIOSColors(result, fallbackColors)
          : resolveWebColors(result, fallbackColors)

    colorCache.set(imageUri, colors)
    return colors
  } catch (error) {
    logWarn("Falling back to default player colors", {
      imageUri,
      error: error instanceof Error ? error.message : String(error),
    })
    return fallbackColors
  }
}

export async function updateColorsForImage(imageUri: string | undefined) {
  if (!imageUri) {
    setCurrentColorsState(getDefaultPlayerColors())
    setCurrentImageUriState(null)
    return
  }

  if (imageUri === getCurrentImageUriState()) {
    return
  }

  setIsLoadingColorsState(true)
  setCurrentImageUriState(imageUri)

  const colors = await getTrackColors(imageUri)
  if (imageUri !== getCurrentImageUriState()) {
    return
  }
  setCurrentColorsState(colors)
  setIsLoadingColorsState(false)
}

export function getCachedColors(imageUri: string): ColorPalette | null {
  return colorCache.get(imageUri) || null
}

export function clearColorCache() {
  colorCache.clear()
}

export function getColorCacheSize() {
  return colorCache.size
}
