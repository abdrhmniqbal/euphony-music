import React, { useState } from 'react';
import { Text, View, LayoutChangeEvent } from 'react-native';
import { Marquee } from '@animatereactnative/marquee';

interface MarqueeTextProps {
    text: string;
    className?: string;
    style?: any;
    speed?: number;
    spacing?: number;
}

export const MarqueeText = ({
    text,
    className,
    style,
    speed = 0.6,
    spacing = 40,
}: MarqueeTextProps) => {
    const [textWidth, setTextWidth] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);

    const onTextLayout = (e: LayoutChangeEvent) => {
        setTextWidth(e.nativeEvent.layout.width);
    };

    const onContainerLayout = (e: LayoutChangeEvent) => {
        setContainerWidth(e.nativeEvent.layout.width);
    };

    const shouldAnimate = textWidth > 0 && containerWidth > 0 && textWidth > containerWidth;

    if (!text) return null;

    return (
        <View onLayout={onContainerLayout} style={{ width: '100%', overflow: 'hidden' }}>
            <View style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', flexDirection: 'row' }}>
                <View style={{ width: 9999, flexDirection: 'row' }}>
                    <Text
                        className={className}
                        style={style}
                        numberOfLines={1}
                        onLayout={onTextLayout}
                    >
                        {text}
                    </Text>
                </View>
            </View>

            {shouldAnimate ? (
                <Marquee
                    speed={speed}
                    spacing={spacing}
                    style={{ width: '100%' }}
                >
                    <Text className={className} style={style} numberOfLines={1}>
                        {text}
                    </Text>
                </Marquee>
            ) : (
                <Text className={className} style={style} numberOfLines={1}>
                    {text}
                </Text>
            )}
        </View>
    );
};
