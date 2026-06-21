import { Text, View } from "react-native"

import { SectionTitle } from "@/components/ui/section-header"

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
      <SectionTitle title={title} />
      <Text className="text-base leading-6 text-muted">{bio}</Text>
    </View>
  )
}
