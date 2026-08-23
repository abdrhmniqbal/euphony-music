import { BottomSheet } from "heroui-native"
import type { ReactNode } from "react"

interface ActionSheetRootProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

function ActionSheetRoot({ isOpen, onOpenChange, children }: ActionSheetRootProps) {
  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        {children}
      </BottomSheet.Portal>
    </BottomSheet>
  )
}

interface ActionSheetContentProps {
  className?: string
  contentContainerClassName?: string
  backgroundClassName?: string
  snapPoints?: string[]
  enableDynamicSizing?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- passes through to gorhom footer render prop
  footerComponent?: (props: any) => ReactNode
  children: ReactNode
}

function ActionSheetContent({
  className,
  contentContainerClassName,
  backgroundClassName = "bg-surface",
  snapPoints,
  enableDynamicSizing,
  footerComponent,
  children,
}: ActionSheetContentProps) {
  return (
    <BottomSheet.Content
      backgroundClassName={backgroundClassName}
      className={className}
      contentContainerClassName={contentContainerClassName}
      snapPoints={snapPoints}
      enableDynamicSizing={enableDynamicSizing}
      footerComponent={footerComponent}
    >
      {children}
    </BottomSheet.Content>
  )
}

export const ActionSheet = {
  Root: ActionSheetRoot,
  Content: ActionSheetContent,
}
