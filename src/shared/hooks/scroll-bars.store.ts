import { atom } from 'nanostores';

export const $barsVisible = atom(true);
export const $isPlayerExpanded = atom(false);
export const $showPlayerQueue = atom(false);

let lastScrollY = 0;
let showTimeout: NodeJS.Timeout | null = null;

export const handleScroll = (currentY: number) => {
    if (showTimeout) {
        clearTimeout(showTimeout);
        showTimeout = null;
    }

    const isScrollingDown = currentY > lastScrollY && currentY > 50;
    const isScrollingUp = currentY < lastScrollY;

    if (isScrollingDown) {
        $barsVisible.set(false);
    } else if (isScrollingUp) {
        $barsVisible.set(true);
    }

    lastScrollY = currentY;
};

export const handleScrollStart = () => {
    if (showTimeout) {
        clearTimeout(showTimeout);
        showTimeout = null;
    }
};

export const handleScrollStop = () => {
    if (showTimeout) {
        clearTimeout(showTimeout);
    }
    showTimeout = setTimeout(() => {
        $barsVisible.set(true);
    }, 150);
};
