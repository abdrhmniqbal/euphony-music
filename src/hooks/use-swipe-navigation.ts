import { useRouter } from "expo-router";
import { Gesture } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

const MAIN_TABS = ["(home)", "(search)", "(library)"] as const;
type MainTab = typeof MAIN_TABS[number];

export function useSwipeNavigation(currentTab: MainTab) {
    const router = useRouter();

    const navigateTab = (direction: 'left' | 'right') => {
        const currentIndex = MAIN_TABS.indexOf(currentTab);
        if (direction === 'left' && currentIndex < MAIN_TABS.length - 1) {
            const nextTab = MAIN_TABS[currentIndex + 1];
            router.replace(`/${nextTab}`);
        } else if (direction === 'right' && currentIndex > 0) {
            const prevTab = MAIN_TABS[currentIndex - 1];
            router.replace(`/${prevTab}`);
        }
    };

    const swipeGesture = Gesture.Pan()
        .activeOffsetX([-20, 20])
        .onEnd((event) => {
            if (Math.abs(event.translationX) > Math.abs(event.translationY)) {
                if (event.translationX > 50) {
                    runOnJS(navigateTab)('right');
                } else if (event.translationX < -50) {
                    runOnJS(navigateTab)('left');
                }
            }
        });

    return { swipeGesture };
}
