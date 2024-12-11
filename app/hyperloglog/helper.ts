export const generateRandomIPv4 = () => {
    return Array.from({ length: 4 }, () =>
        Math.floor(Math.random() * 256)
    ).join('.')
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
