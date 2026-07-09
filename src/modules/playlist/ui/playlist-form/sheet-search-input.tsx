import type { SheetSearchInputProps } from "./types"
import { Input, PressableFeedback, TextField } from "heroui-native"
import * as React from "react"
import { useTranslation } from "react-i18next"

import { View } from "react-native"
import LocalCancelCircleSolidIcon from "@/modules/shared/components/icons/local/cancel-circle-solid"
import LocalSearch01Icon from "@/modules/shared/components/icons/local/search-01"

import { useThemeColors } from "@/modules/ui/theme"
import { useBottomSheetSearchInput } from "@/modules/search/ui/use-bottom-sheet-search-input"

export function SheetSearchInput({ inputKey, searchQuery, setSearchQuery }: SheetSearchInputProps) {
  const theme = useThemeColors()
  const { t } = useTranslation()
  const { inputRef, handleOnFocus, handleOnBlur } = useBottomSheetSearchInput()

  return (
    <TextField className="absolute top-0 right-0 left-0 px-5 pt-2">
      <View className="w-full flex-row items-center">
        <Input
          key={inputKey}
          ref={inputRef}
          placeholder={t("playlist.searchTracksPlaceholder")}
          onChangeText={setSearchQuery}
          className="flex-1 pr-10 pl-12"
          variant="secondary"
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={handleOnFocus}
          onBlur={handleOnBlur}
        />
        <View className="absolute left-3.5" pointerEvents="none">
          <LocalSearch01Icon fill="none" width={24} height={24} color={theme.muted} />
        </View>
        {searchQuery.length > 0 ? (
          <PressableFeedback
            className="absolute right-3 p-1"
            onPress={() => {
              inputRef.current?.clear()
              setSearchQuery("")
            }}
            hitSlop={12}
          >
            <LocalCancelCircleSolidIcon fill="none" width={18} height={18} color={theme.muted} />
          </PressableFeedback>
        ) : null}
      </View>
    </TextField>
  )
}
