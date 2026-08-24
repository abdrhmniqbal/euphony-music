import { getColors, type ImageColorsResult } from "react-native-image-colors"

import { logWarn } from "@/core/log/service"

import {
  type ColorPalette,
  getCurrentImageUriState,
  getDefaultPlayerColors,
  setCurrentColorsState,
  setCurrentImageUriState,
  setIsLoadingColorsState,
} from "./colors-store"

const colorCache = new Map<string, ColorPalette>()

function resolveAndroidColors(
  result: ImageColorsResult,
  fallbackColors: ColorPalette
): ColorPalette {
  if (result.platform !== "android") {
    return fallbackColors
  }

  return {
    bg: result.average || fallbackColors.bg,
    primary: result.dominant || fallbackColors.primary,
    secondary: result.darkVibrant || fallbackColors.secondary,
  }
}

function resolveIOSColors(result: ImageColorsResult, fallbackColors: ColorPalette): ColorPalette {
  if (result.platform !== "ios") {
    return fallbackColors
  }

  return {
    bg: result.background || fallbackColors.bg,
    primary: result.primary || fallbackColors.primary,
    secondary: result.detail || fallbackColors.secondary,
  }
}

async function getTrackColors(imageUri: string): Promise<ColorPalette> {
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
          : fallbackColors

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

  setCurrentImageUriState(imageUri)
  setIsLoadingColorsState(true)
  try {
    const colors = await getTrackColors(imageUri)
    if (getCurrentImageUriState() === imageUri) {
      setCurrentColorsState(colors)
    }
  } finally {
    setIsLoadingColorsState(false)
  }
}
