import * as React from "react"
import { ScrollView, View, type ScrollViewProps } from "react-native"
import { ListGroup, Separator, Switch } from "heroui-native"

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

export function SettingsNavigationRow({
  title,
  description,
  onPress,
  disabled,
}: {
  title: string
  description?: string | null
  onPress: () => void
  disabled?: boolean
}) {
  return (
    <ListGroup.Item onPress={onPress} disabled={disabled}>
      <ListGroup.ItemContent>
        <ListGroup.ItemTitle>{title}</ListGroup.ItemTitle>
        {description ? (
          <ListGroup.ItemDescription>{description}</ListGroup.ItemDescription>
        ) : null}
      </ListGroup.ItemContent>
      <ListGroup.ItemSuffix />
    </ListGroup.Item>
  )
}

export function SettingsActionRow({
  title,
  description,
  onPress,
  disabled,
}: {
  title: string
  description?: string | null
  onPress: () => void
  disabled?: boolean
}) {
  // Navigation row already includes a chevron suffix (if configured that way),
  // but if we need a distinct Action Row (e.g. for "Check for updates"), it usually just relies on the ItemSuffix being present/absent.
  // We'll mimic the current codebase which just leaves ListGroup.ItemSuffix empty to render a chevron.
  return (
    <ListGroup.Item onPress={onPress} disabled={disabled}>
      <ListGroup.ItemContent>
        <ListGroup.ItemTitle>{title}</ListGroup.ItemTitle>
        {description ? (
          <ListGroup.ItemDescription>{description}</ListGroup.ItemDescription>
        ) : null}
      </ListGroup.ItemContent>
      <ListGroup.ItemSuffix />
    </ListGroup.Item>
  )
}

export function SettingsSwitchRow({
  title,
  description,
  isSelected,
  onSelectedChange,
  disabled,
}: {
  title: string
  description?: string | null
  isSelected: boolean
  onSelectedChange: (selected: boolean) => void
  disabled?: boolean
}) {
  return (
    <ListGroup.Item disabled={disabled}>
      <ListGroup.ItemContent>
        <ListGroup.ItemTitle>{title}</ListGroup.ItemTitle>
        {description ? (
          <ListGroup.ItemDescription>{description}</ListGroup.ItemDescription>
        ) : null}
      </ListGroup.ItemContent>
      <ListGroup.ItemSuffix>
        <Switch isSelected={isSelected} onSelectedChange={onSelectedChange} isDisabled={disabled} />
      </ListGroup.ItemSuffix>
    </ListGroup.Item>
  )
}
