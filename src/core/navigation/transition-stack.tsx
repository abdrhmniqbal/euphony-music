import { withLayoutContext } from "expo-router"
import type { ParamListBase, StackNavigationState } from "expo-router/react-navigation"
import {
  createNativeStackNavigator,
  type NativeStackNavigationEventMap,
  type NativeStackNavigationOptions,
} from "react-native-screen-transitions/native-stack"

const { Navigator } = createNativeStackNavigator()

// Expo Router layout adapter around react-native-screen-transitions' stack
// navigator; mounts the descriptors provider required by boundary components.
export const TransitionStack = withLayoutContext<
  NativeStackNavigationOptions,
  typeof Navigator,
  StackNavigationState<ParamListBase>,
  NativeStackNavigationEventMap
>(Navigator)
