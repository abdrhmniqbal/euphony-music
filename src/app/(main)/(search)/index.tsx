import { useTranslation } from "react-i18next"
import { View } from "react-native"

import LocalSearch01Icon from "@/components/icons/local/search-01"
import { EmptyState } from "@/components/ui/empty-state"
import { useThemeColors } from "@/core/theme/use-theme-colors"

export default function SearchScreen() {
  const { t } = useTranslation()
  const theme = useThemeColors()

  return (
    <View className="flex-1 bg-background">
      <EmptyState
        icon={<LocalSearch01Icon fill="none" width={48} height={48} color={theme.muted} />}
        title={t("search.comingSoonTitle")}
        message={t("search.comingSoonMessage")}
      />
    </View>
  )
}
