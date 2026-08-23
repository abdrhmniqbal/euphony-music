import { useTranslation } from "react-i18next"
import { View } from "react-native"

import LocalHome09Icon from "@/components/icons/local/home-09"
import { EmptyState } from "@/components/ui/empty-state"
import { useThemeColors } from "@/core/theme/use-theme-colors"

export default function HomeScreen() {
  const { t } = useTranslation()
  const theme = useThemeColors()

  return (
    <View className="flex-1 bg-background">
      <EmptyState
        icon={<LocalHome09Icon fill="none" width={48} height={48} color={theme.muted} />}
        title={t("home.comingSoonTitle")}
        message={t("home.comingSoonMessage")}
      />
    </View>
  )
}
