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
  const [muted, foreground, accent, border, defaultColor, background] = useThemeColor([
    "muted",
    "foreground",
    "accent",
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
            color: foreground,
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
          h3: {
            color: foreground,
            fontSize: 17,
            fontWeight: "600",
            lineHeight: 24,
            marginTop: 8,
            marginBottom: 10,
          },
          h4: {
            color: foreground,
            fontSize: 15,
            fontWeight: "600",
            lineHeight: 22,
          },
          h5: {
            color: foreground,
            fontSize: 14,
            fontWeight: "600",
            lineHeight: 20,
          },
          h6: {
            color: muted,
            fontSize: 13,
            fontWeight: "600",
            lineHeight: 20,
          },
          list: {
            color: foreground,
            bulletColor: muted,
            marginLeft: 20,
            gapWidth: 8,
          },
          blockquote: {
            color: muted,
            borderColor: border,
            borderWidth: 3,
          },
          link: {
            color: accent,
          },
          strong: {
            color: foreground,
          },
          em: {
            color: foreground,
          },
          code: {
            color: foreground,
            backgroundColor: defaultColor,
          },
          codeBlock: {
            color: foreground,
            backgroundColor: defaultColor,
            borderColor: border,
            borderRadius: 8,
            padding: 10,
          },
          thematicBreak: {
            color: border,
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
