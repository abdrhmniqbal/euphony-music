import { Platform } from "react-native"

import { registerWidgetTaskHandler } from "react-native-android-widget"

import { widgetTaskHandler } from "@/widgets/widget-task-handler"

// Runs at bundle evaluation because Android launches the widget headless task
// against this entry file without mounting the Expo Router tree.
if (Platform.OS === "android") {
  registerWidgetTaskHandler(widgetTaskHandler)
}
