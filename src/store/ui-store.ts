import { atom } from 'nanostores';

export const $barsVisible = atom(true);
export const $isPlayerExpanded = atom(false);

let scrollTimeout: NodeJS.Timeout;

export const handleScrollStart = () => {
    $barsVisible.set(false);
    if (scrollTimeout) clearTimeout(scrollTimeout);
};

export const handleScrollStop = () => {
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        $barsVisible.set(true);
    }, 150);
};
