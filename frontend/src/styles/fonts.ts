import '@fontsource-variable/inter'
import '@fontsource-variable/fira-code'

// Font combinations
export const fontSets = {
    default: {
        sans: 'Inter Variable',
        mono: 'Fira Code Variable'
    }
} as const

// Active font set
export const activeFontSet = 'default'

// Get the active font variables
export const fontVariables = fontSets[activeFontSet]

// Update CSS variables when fonts change
export function updateFonts(setName: keyof typeof fontSets = activeFontSet) {
    const fonts = fontSets[setName]
    document.documentElement.style.setProperty('--font-sans', fonts.sans)
    document.documentElement.style.setProperty('--font-mono', fonts.mono)
} 