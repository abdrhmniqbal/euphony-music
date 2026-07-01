/**
 * Purpose: Renders GitHub release notes markdown with app theme styling.
 * Caller: What's New settings screen and app update bottom sheet.
 * Dependencies: react-native-enriched-markdown, React Native Linking, app theme colors.
 * Main Functions: ReleaseNotesMarkdown()
 * Side Effects: Opens markdown links in the external browser.
 */

import { Linking, View } from "react-native"
import { EnrichedMarkdownText } from "react-native-enriched-markdown"

import { useThemeColors } from "@/modules/ui/theme"

export function ReleaseNotesMarkdown({ markdown, selectable = true }: { markdown: string; selectable?: boolean }) {
  const theme = useThemeColors()

  const processedMarkdown = markdown.replace(
    /(https?:\/\/[^\s)]+)/g,
    (url) => {
      try {
        const parsed = new URL(url)
        const path = parsed.pathname + parsed.search + parsed.hash
        // GitHub compare: show v1.0.0-rc.2...v1.0.0
        const compareMatch = path.match(/^\/[^/]+\/[^/]+\/compare\/(.+\.\.\..+)$/)
        if (compareMatch?.[1]) return `[${compareMatch[1]}](${url})`
        // Other GitHub links: show owner/repo or path
        const segments = parsed.pathname.split('/').filter(Boolean)
        if (segments.length > 2) return `[${segments.slice(0, 2).join('/')}\u2026](${url})`
        return `[${parsed.host}${path}](${url})`
      } catch {
        return url
      }
    }
  )

  return (
    <View>
      <EnrichedMarkdownText
        markdown={processedMarkdown}
        flavor="github"
        selectable={selectable}
        allowTrailingMargin={false}
        onLinkPress={(event) => {
          void Linking.openURL(event.url)
        }}
        markdownStyle={{
          paragraph: {
            color: theme.muted,
            fontSize: 14,
            lineHeight: 22,
            marginBottom: 10,
          },
          h1: {
            color: theme.foreground,
            fontSize: 21,
            fontWeight: "700",
            lineHeight: 28,
            marginBottom: 10,
          },
          h2: {
            color: theme.foreground,
            fontSize: 18,
            fontWeight: "700",
            lineHeight: 25,
            marginBottom: 8,
          },
          h3: {
            color: theme.foreground,
            fontSize: 16,
            fontWeight: "700",
            lineHeight: 23,
            marginBottom: 8,
          },
          list: {
            color: theme.muted,
            fontSize: 14,
            lineHeight: 22,
            marginBottom: 8,
            markerColor: theme.muted,
            bulletColor: theme.muted,
            gapWidth: 8,
          },
          link: {
            color: theme.accent,
            underline: true,
          },
          strong: {
            color: theme.foreground,
            fontWeight: "bold",
          },
          em: {
            color: theme.muted,
            fontStyle: "italic",
          },
          code: {
            color: theme.foreground,
            backgroundColor: theme.default,
            borderColor: theme.border,
            fontSize: 13,
          },
          codeBlock: {
            color: theme.foreground,
            backgroundColor: theme.default,
            borderColor: theme.border,
            borderRadius: 8,
            borderWidth: 1,
            padding: 10,
            fontSize: 13,
            lineHeight: 20,
            marginBottom: 10,
          },
          blockquote: {
            color: theme.muted,
            backgroundColor: theme.background,
            borderColor: theme.border,
            borderWidth: 3,
            gapWidth: 10,
            marginBottom: 10,
          },
          thematicBreak: {
            color: theme.border,
            height: 1,
            marginTop: 8,
            marginBottom: 12,
          },
          table: {
            color: theme.muted,
            fontSize: 13,
            lineHeight: 20,
            borderColor: theme.border,
            borderWidth: 1,
            borderRadius: 8,
            headerBackgroundColor: theme.default,
            headerTextColor: theme.foreground,
            rowEvenBackgroundColor: theme.background,
            rowOddBackgroundColor: theme.default,
          },
        }}
      />
    </View>
  )
}
