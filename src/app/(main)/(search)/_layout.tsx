import { Stack } from "expo-router";
import { Colors } from "@/constants/colors";
import { useUniwind } from "uniwind";

export default function SearchLayout() {
    const { theme: currentTheme } = useUniwind();
    const theme = Colors[currentTheme === 'dark' ? 'dark' : 'light'];

    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: theme.background,
                },
                headerTintColor: theme.foreground,
                headerShadowVisible: false,
                contentStyle: { backgroundColor: theme.background },
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: "Search",
                    headerLargeTitle: true,
                }}
            />
        </Stack>
    );
}
