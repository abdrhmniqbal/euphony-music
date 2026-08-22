import { Text, View } from "react-native"

import { SectionHeader } from "@/modules/shared/components/ui/section-header"

interface ArtistInfoSectionProps {
  title: string
  bio?: string
}

export function ArtistInfoSection({ title, bio }: ArtistInfoSectionProps) {
  if (!bio) {
    return null
  }

  return (
    <View className="mt-8 px-6">
      <SectionHeader title={title} />
      <View className="overflow-hidden rounded-2xl bg-surface p-4">
        <Text className="text-sm leading-5 text-foreground">{bio}</Text>
      </View>
    </View>
  )
}
