import { FlexWidget, TextWidget } from "react-native-android-widget"

import type { DataTrack } from "@/domains/tracks/types"

const ACCENT = "#0088F6"

const LIGHT = {
  surface: "#FFFFFF" as const,
  title: "#141414" as const,
  subtitle: "#6B7280" as const,
  tile: "#EDEFF3" as const,
  glyph: "#374151" as const,
}

const DARK = {
  surface: "#101014" as const,
  title: "#F5F5F5" as const,
  subtitle: "#9CA3AF" as const,
  tile: "#1C1F26" as const,
  glyph: "#D1D5DB" as const,
}

type Palette = typeof LIGHT | typeof DARK

export interface PlayerWidgetSnapshot {
  trackName: string
  artistName: string
  isPlaying: boolean
}

export function snapshotFromTrack(
  track: Pick<DataTrack, "name" | "artists" | "artistName"> | undefined,
  isPlaying: boolean
): PlayerWidgetSnapshot {
  const artist =
    track?.artistName ?? (track?.artists && track.artists.length > 0 ? track.artists[0] : null)
  return {
    trackName: track?.name ?? "Not playing",
    artistName: artist ?? "Startune Music",
    isPlaying,
  }
}

function ControlButton({
  glyph,
  clickAction,
  palette,
}: {
  glyph: string
  clickAction: string
  palette: Palette
}) {
  return (
    <FlexWidget
      clickAction={clickAction}
      style={{
        height: 36,
        width: 36,
        borderRadius: 18,
        backgroundColor: palette.tile,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <TextWidget
        text={glyph}
        style={{
          color: palette.glyph,
          fontSize: 16,
        }}
      />
    </FlexWidget>
  )
}

export function PlayerWidget({
  snapshot,
  dark,
}: {
  snapshot: PlayerWidgetSnapshot
  dark: boolean
}) {
  const palette = dark ? DARK : LIGHT

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: "match_parent",
        width: "match_parent",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: palette.surface,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
      }}
    >
      <FlexWidget
        style={{
          height: 44,
          width: 44,
          borderRadius: 12,
          backgroundColor: palette.tile,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 10,
        }}
      >
        <TextWidget
          text="♪"
          style={{
            color: ACCENT,
            fontSize: 22,
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
            color: palette.title,
            fontSize: 14,
            fontWeight: "bold",
          }}
        />
        <TextWidget
          text={snapshot.artistName}
          maxLines={1}
          truncate="END"
          style={{
            color: palette.subtitle,
            fontSize: 12,
            marginTop: 2,
          }}
        />
      </FlexWidget>

      <FlexWidget clickAction="OPEN_APP" style={{ flexDirection: "row", alignItems: "center" }}>
        <ControlButton glyph="⏮" clickAction="PREVIOUS" palette={palette} />
        <FlexWidget
          clickAction="PLAY_PAUSE"
          style={{
            height: 40,
            width: 40,
            borderRadius: 20,
            backgroundColor: ACCENT,
            alignItems: "center",
            justifyContent: "center",
            marginHorizontal: 2,
          }}
        >
          <TextWidget
            text={snapshot.isPlaying ? "⏸" : "▶"}
            style={{
              color: "#FFFFFF",
              fontSize: 17,
            }}
          />
        </FlexWidget>
        <ControlButton glyph="⏭" clickAction="NEXT" palette={palette} />
      </FlexWidget>
    </FlexWidget>
  )
}
