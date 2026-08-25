"use no memo"

import { FlexWidget, TextWidget } from "react-native-android-widget"

import { i18n } from "@/core/localization/i18n"
import type { DataTrack } from "@/domains/tracks/types"
import type { ThemeColors } from "@/core/theme/colors"

export interface PlayerWidgetSnapshot {
  trackName: string
  artistName: string
  isPlaying: boolean
}

// react-native-android-widget accepts hex and rgba strings at runtime; its types just cannot see it
function toWidgetColor(value: string): `#${string}` {
  // SAFETY: static theme color values are always hex strings
  return value as `#${string}`
}

export function snapshotFromTrack(
  track: Pick<DataTrack, "name" | "artists" | "artistName"> | undefined,
  isPlaying: boolean
): PlayerWidgetSnapshot {
  const artist =
    track?.artistName ?? (track?.artists && track.artists.length > 0 ? track.artists[0] : null)
  return {
    trackName: track?.name ?? i18n.t("player.notPlaying"),
    artistName: artist ?? "Startune Music",
    isPlaying,
  }
}

function ControlGlyph({
  glyph,
  clickAction,
  colors,
}: {
  glyph: string
  clickAction: string
  colors: ThemeColors
}) {
  return (
    <FlexWidget
      clickAction={clickAction}
      style={{
        height: 40,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <TextWidget
        text={glyph}
        style={{
          color: toWidgetColor(colors.foreground),
          fontSize: 19,
        }}
      />
    </FlexWidget>
  )
}

export function PlayerWidget({
  snapshot,
  colors,
}: {
  snapshot: PlayerWidgetSnapshot
  colors: ThemeColors
}) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: "match_parent",
        width: "match_parent",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: toWidgetColor(colors.surface),
        borderColor: toWidgetColor(colors.border),
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
      }}
    >
      <FlexWidget
        style={{
          height: 44,
          width: 44,
          borderRadius: 8,
          backgroundColor: toWidgetColor(colors.default),
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <TextWidget
          text="♪"
          style={{
            color: toWidgetColor(colors.muted),
            fontSize: 20,
            fontWeight: "bold",
          }}
        />
      </FlexWidget>

      <FlexWidget
        style={{
          flex: 1,
          flexDirection: "column",
          justifyContent: "center",
          marginRight: 8,
        }}
      >
        <TextWidget
          text={snapshot.trackName}
          maxLines={1}
          truncate="END"
          style={{
            color: toWidgetColor(colors.foreground),
            fontSize: 15,
            fontWeight: "bold",
          }}
        />
        <TextWidget
          text={snapshot.artistName}
          maxLines={1}
          truncate="END"
          style={{
            color: toWidgetColor(colors.muted),
            fontSize: 13,
            marginTop: 2,
          }}
        />
      </FlexWidget>

      <FlexWidget
        clickAction="PLAY_PAUSE"
        style={{
          height: 40,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 4,
        }}
      >
        <TextWidget
          text={snapshot.isPlaying ? "⏸" : "▶"}
          style={{
            color: toWidgetColor(colors.foreground),
            fontSize: 21,
          }}
        />
      </FlexWidget>
      <ControlGlyph glyph="⏭" clickAction="NEXT" colors={colors} />
    </FlexWidget>
  )
}
