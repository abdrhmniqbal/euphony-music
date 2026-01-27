import { Stack, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { Colors } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useUniwind } from "uniwind";

export default function LibraryLayout() {
    const { theme: currentTheme } = useUniwind();
    const theme = Colors[currentTheme === 'dark' ? 'dark' : 'light'];
    const router = useRouter();

    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: theme.background,
                },
                headerTintColor: theme.foreground,
                headerShadowVisible: false,
                headerTitleAlign: 'center',
                contentStyle: { backgroundColor: theme.background },
                animation: 'default',
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: "Library",
                    headerLargeTitle: true,
                    headerTitleAlign: 'left',
                    headerRight: () => (
                        <View className="flex-row gap-4 mr-1">
                            <Pressable
                                onPress={() => router.push("/search-interaction")}
                                className="active:opacity-50"
                            >
                                <Ionicons name="search-outline" size={24} color={theme.foreground} />
                            </Pressable>
                            <Pressable onPress={() => router.push("/settings")} className="active:opacity-50">
                                <Ionicons name="settings-outline" size={24} color={theme.foreground} />
                            </Pressable>
                        </View>
                    ),
                }}
            />
        </Stack>
    );
}
