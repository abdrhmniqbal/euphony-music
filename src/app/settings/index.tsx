/**
 * Purpose: Renders the settings hub with grouped routes for app preferences and system options.
 * Caller: Settings root route.
 * Dependencies: Expo Router, react-i18next, settings route definitions, HeroUI Native ListGroup.
 * Main Functions: SettingsScreen()
 * Side Effects: Navigates to settings detail routes.
 */

import { useGuardedRouter as useRouter } from "@/modules/navigation/use-guarded-router"
import { ListGroup, Separator } from "heroui-native"
import * as React from "react"
import { ScrollView, View } from "react-native"
import { useTranslation } from "react-i18next"

import { SETTINGS_CATEGORY_ROUTES } from "@/modules/settings/routes"

export default function SettingsScreen() {
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 48 }}>
      <View className="gap-5 px-4 py-4">
        <ListGroup>
          {SETTINGS_CATEGORY_ROUTES.map((route, index) => (
            <React.Fragment key={route.name}>
              {index > 0 && <Separator className="mx-4" />}
              <ListGroup.Item onPress={() => router.push(`/settings/${route.name}`)}>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>{t(route.titleKey)}</ListGroup.ItemTitle>
                  {route.descriptionKey ? (
                    <ListGroup.ItemDescription>{t(route.descriptionKey)}</ListGroup.ItemDescription>
                  ) : null}
                </ListGroup.ItemContent>
                <ListGroup.ItemSuffix />
              </ListGroup.Item>
            </React.Fragment>
          ))}
        </ListGroup>
      </View>
    </ScrollView>
  )
}
