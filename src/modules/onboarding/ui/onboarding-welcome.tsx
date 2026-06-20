import { Image } from "expo-image"
import { Text, View } from "react-native"
import { useTranslation } from "react-i18next"
import appIcon from "@/assets/icon.png"

interface OnboardingWelcomeProps {
  step: number
  appName: string
}

export function OnboardingWelcome({ step, appName }: OnboardingWelcomeProps) {
  const { t } = useTranslation()

  return (
    <View className="items-center justify-center gap-4 py-6">
      <Image source={appIcon} style={{ width: 80, height: 80 }} contentFit="contain" />
      <View className="items-center gap-1">
        <Text className="text-sm font-medium text-muted">{step + 1} / 3</Text>
        <Text className="text-2xl font-bold text-foreground">
          {t("onboarding.welcomePrefix")} {appName}
        </Text>
        <Text className="text-center text-sm text-muted">{t("onboarding.welcomeDescription")}</Text>
      </View>
    </View>
  )
}
