import { useThemeColor } from "heroui-native"

import { Linking, View } from "react-native"
import { EnrichedMarkdownText } from "react-native-enriched-markdown"

export function ReleaseNotesMarkdown({
  markdown,
  selectable = true,
}: {
  markdown: string
  selectable?: boolean
}) {
  const [muted, foreground, border, defaultColor, background] = useThemeColor([
    "muted",
    "foreground",
    "border",
    "default",
    "background",
  ])

  const processedMarkdown = markdown.replace(/(https?:\/\/[^\s)]+)/g, (url) => {
    try {
      const parsed = new URL(url)
      const path = parsed.pathname + parsed.search + parsed.hash
      // GitHub compare: show v1.0.0-rc.2...v1.0.0
      const compareMatch = path.match(/^\/[^/]+\/[^/]+\/compare\/(.+\.\.\..+)$/)
      if (compareMatch?.[1]) return `[${compareMatch[1]}](${url})`
      // Other GitHub links: show owner/repo or path
      const segments = parsed.pathname.split("/").filter(Boolean)
      if (segments.length > 2) return `[${segments.slice(0, 2).join("/")}\u2026](${url})`
      return `[${parsed.host}${path}](${url})`
    } catch {
      return url
    }
  })

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
            color: muted,
            fontSize: 14,
            lineHeight: 22,
            marginBottom: 10,
          },
          h1: {
            color: foreground,
            fontSize: 21,
            fontWeight: "700",
            lineHeight: 28,
            marginBottom: 10,
          },
          h2: {
            color: foreground,
            fontSize: 19,
            fontWeight: "600",
            lineHeight: 26,
            marginTop: 8,
            marginBottom: 12,
          },
          table: {
            color: muted,
            fontSize: 13,
            lineHeight: 20,
            borderColor: border,
            borderWidth: 1,
            borderRadius: 8,
            headerBackgroundColor: defaultColor,
            headerTextColor: foreground,
            rowEvenBackgroundColor: background,
            rowOddBackgroundColor: defaultColor,
          },
        }}
      />
    </View>
  )
}
