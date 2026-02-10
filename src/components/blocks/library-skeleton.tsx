import React from "react";
import { View, Animated, Dimensions } from "react-native";
import { useUniwind } from "uniwind";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LibrarySkeletonProps {
    type: 'tracks' | 'albums' | 'artists';
    itemCount?: number;
}

const ShimmerView = ({ className }: { className?: string }) => {
    const shimmerAnim = React.useRef(new Animated.Value(0)).current;
    const { theme } = useUniwind();
    const isDark = theme === 'dark';

    React.useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, []);

    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
    });

    return (
        <View className={`overflow-hidden ${className}`}>
            <Animated.View
                className="absolute inset-0"
                style={{
                    transform: [{ translateX }],
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                }}
            />
        </View>
    );
};

const TrackSkeleton = () => (
    <View className="flex-row items-center gap-3 py-2.5">
        <View className="w-14 h-14 rounded-lg bg-default">
            <ShimmerView className="w-full h-full" />
        </View>
        <View className="flex-1 justify-center gap-0.5">
            <View className="h-4 w-3/4 rounded bg-default">
                <ShimmerView className="w-full h-full" />
            </View>
            <View className="h-3 w-1/2 rounded bg-default">
                <ShimmerView className="w-full h-full" />
            </View>
        </View>
    </View>
);

const AlbumSkeleton = () => {
    const GAP = 12;
    const NUM_COLUMNS = 2;
    const HORIZONTAL_PADDING = 32;
    const ITEM_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING - (GAP * (NUM_COLUMNS - 1))) / NUM_COLUMNS;
    
    return (
        <View style={{ width: ITEM_WIDTH }}>
            <View className="w-full aspect-square rounded-md bg-default">
                <ShimmerView className="w-full h-full" />
            </View>
            <View className="mt-1">
                <View className="h-4 w-full rounded bg-default">
                    <ShimmerView className="w-full h-full" />
                </View>
                <View className="mt-0.5 h-3 w-2/3 rounded bg-default">
                    <ShimmerView className="w-full h-full" />
                </View>
            </View>
        </View>
    );
};

const ArtistSkeleton = () => {
    const GAP = 12;
    const NUM_COLUMNS = 3;
    const HORIZONTAL_PADDING = 28;
    const ITEM_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING - (GAP * (NUM_COLUMNS - 1))) / NUM_COLUMNS;
    
    return (
        <View style={{ width: ITEM_WIDTH }} className="items-center">
            <View className="w-full aspect-square rounded-full bg-default">
                <ShimmerView className="w-full h-full" />
            </View>
            <View className="mt-1 items-center">
                <View className="h-4 w-full rounded bg-default">
                    <ShimmerView className="w-full h-full" />
                </View>
                <View className="mt-0.5 h-3 w-2/3 rounded bg-default">
                    <ShimmerView className="w-full h-full" />
                </View>
            </View>
        </View>
    );
};

export const LibrarySkeleton: React.FC<LibrarySkeletonProps> = ({
    type,
    itemCount = 6
}) => {
    const renderSkeleton = () => {
        switch (type) {
            case 'tracks':
                return (
                    <View style={{ gap: 8 }}>
                        {Array.from({ length: itemCount }).map((_, i) => (
                            <TrackSkeleton key={i} />
                        ))}
                    </View>
                );
            case 'albums': {
                const GAP = 12;
                const NUM_COLUMNS = 2;
                const rows = [];
                for (let i = 0; i < itemCount; i += NUM_COLUMNS) {
                    rows.push(
                        <View key={i} className="flex-row" style={{ gap: GAP }}>
                            {Array.from({ length: Math.min(NUM_COLUMNS, itemCount - i) }).map((_, j) => (
                                <AlbumSkeleton key={i + j} />
                            ))}
                        </View>
                    );
                }
                return (
                    <View style={{ gap: GAP }}>
                        {rows}
                    </View>
                );
            }
            case 'artists': {
                const GAP = 12;
                const NUM_COLUMNS = 3;
                const rows = [];
                for (let i = 0; i < itemCount; i += NUM_COLUMNS) {
                    rows.push(
                        <View key={i} className="flex-row" style={{ gap: GAP }}>
                            {Array.from({ length: Math.min(NUM_COLUMNS, itemCount - i) }).map((_, j) => (
                                <ArtistSkeleton key={i + j} />
                            ))}
                        </View>
                    );
                }
                return (
                    <View style={{ gap: GAP }}>
                        {rows}
                    </View>
                );
            }
        }
    };

    return (
        <View>
            {renderSkeleton()}
        </View>
    );
};
