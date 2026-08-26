import * as React from "react"
import { ScrollView, View, type ScrollViewProps } from "react-native"
import { ListGroup, Separator } from "heroui-native"
import { Switch } from "@/components/ui/switch"

export function SettingsScrollView({
  children,
  ...props
}: ScrollViewProps & { children: React.ReactNode }) {
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={[{ paddingBottom: 40 }, props.contentContainerStyle]}
      {...props}
    >
      <View className="gap-5 px-4 py-4">{children}</View>
    </ScrollView>
  )
}

export function SettingsListGroup({ children }: { children: React.ReactNode }) {
  const childrenArray = React.Children.toArray(children).filter(React.isValidElement)

  return (
    <ListGroup>
      {childrenArray.map((child, index) => (
        <React.Fragment key={index}>
          {index > 0 && <Separator className="mx-4" />}
          {child}
        </React.Fragment>
      ))}
    </ListGroup>
  )
}

interface SettingsNavigationRowProps {
  title: string
  description?: string | null
  onPress: () => void
  disabled?: boolean
  suffix?: React.ReactNode
}

export function SettingsNavigationRow({
  title,
  description,
  onPress,
  disabled,
  suffix,
}: SettingsNavigationRowProps) {
  return (
    <ListGroup.Item onPress={onPress} disabled={disabled}>
      <ListGroup.ItemContent>
        <ListGroup.ItemTitle>{title}</ListGroup.ItemTitle>
        {description ? <ListGroup.ItemDescription>{description}</ListGroup.ItemDescription> : null}
      </ListGroup.ItemContent>
      <ListGroup.ItemSuffix>{suffix ?? null}</ListGroup.ItemSuffix>
    </ListGroup.Item>
  )
}

interface SettingsSwitchRowProps {
  title: string
  description?: string | null
  isSelected: boolean
  onSelectedChange: (selected: boolean) => void
  disabled?: boolean
}

export function SettingsSwitchRow({
  title,
  description,
  isSelected,
  onSelectedChange,
  disabled,
}: SettingsSwitchRowProps) {
  return (
    <ListGroup.Item disabled={disabled}>
      <ListGroup.ItemContent>
        <ListGroup.ItemTitle>{title}</ListGroup.ItemTitle>
        {description ? <ListGroup.ItemDescription>{description}</ListGroup.ItemDescription> : null}
      </ListGroup.ItemContent>
      <ListGroup.ItemSuffix>
        <Switch isSelected={isSelected} onSelectedChange={onSelectedChange} isDisabled={disabled} />
      </ListGroup.ItemSuffix>
    </ListGroup.Item>
  )
}

interface SettingsSectionLabelProps {
  children: React.ReactNode
}

export function SettingsSectionLabel({ children }: SettingsSectionLabelProps) {
  return <View className="px-1 pb-2 pt-4">{children}</View>
}
