import { Tabs } from "heroui-native";
import { cn } from "tailwind-variants";
import type { LibraryTab } from "@/modules/library/tabs";

interface LibraryTabBarProps {
  tabs: LibraryTab[];
  activeTab: LibraryTab;
  onActiveTabChange: (tab: LibraryTab) => void;
  getLibraryTabLabel: (tab: LibraryTab) => string;
}

export function LibraryTabBar({
  tabs,
  activeTab,
  onActiveTabChange,
  getLibraryTabLabel,
}: LibraryTabBarProps) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => onActiveTabChange(value as LibraryTab)}
      variant="secondary"
      className="gap-1.5 px-4 py-4"
    >
      <Tabs.List className="w-full">
        <Tabs.ScrollView
          scrollAlign="start"
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-1 gap-4"
        >
          <Tabs.Indicator />
          {tabs.map((tab) => (
            <Tabs.Trigger key={tab} value={tab} className="py-2">
              {({ isSelected }) => (
                <Tabs.Label
                  className={cn(
                    "text-lg font-semibold",
                    isSelected ? "text-foreground" : "text-muted",
                  )}
                >
                  {getLibraryTabLabel(tab)}
                </Tabs.Label>
              )}
            </Tabs.Trigger>
          ))}
        </Tabs.ScrollView>
      </Tabs.List>
    </Tabs>
  );
}
