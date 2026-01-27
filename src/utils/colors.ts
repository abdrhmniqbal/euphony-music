const rainbowColors = [
    "bg-rainbow-lime",
    "bg-rainbow-light-green",
    "bg-rainbow-teal",
    "bg-rainbow-cyan",
    "bg-rainbow-light-blue",
    "bg-rainbow-sky-blue",
    "bg-rainbow-blue",
    "bg-rainbow-indigo",
    "bg-rainbow-deep-purple",
    "bg-rainbow-purple",
    "bg-rainbow-magenta",
    "bg-rainbow-red",
    "bg-rainbow-orange",
    "bg-rainbow-amber",
    "bg-rainbow-yellow",
    "bg-rainbow-navy",
];

/**
 * Returns a random rainbow color class from the available list.
 * @param exclude An array of color class names to exclude (e.g., ["bg-rainbow-yellow"]).
 */
export const getRandomRainbowColor = (exclude: string[] = []) => {
    const availableColors = rainbowColors.filter(color => !exclude.includes(color));
    const randomIndex = Math.floor(Math.random() * availableColors.length);
    return availableColors[randomIndex];
};
