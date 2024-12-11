export const generateRandomIPv4 = () => {
    const randomInt = Math.floor(Math.random() * 2 ** 32) // Single random 32-bit number
    return `${(randomInt >>> 24) & 255}.${(randomInt >>> 16) & 255}.${(randomInt >>> 8) & 255}.${randomInt & 255}`
}

export const getFormattedNumber = (num: number) => {
    if (num >= 1_000_000_000) {
        return (num / 1000000000).toFixed(2) + 'B'
    }
    if (num >= 1_000_000) {
        return (num / 1000000).toFixed(2) + 'M'
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K'
    }
    return num.toString()
}
