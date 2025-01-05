export type theme = 'dark' | 'light' | 'system'

export function getSystemTheme(): theme {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark'
    }
    return 'light'
}

export function setTheme(theme: theme) {
    const root = window.document.documentElement
    root.classList.remove('dark')

    if (theme === 'system') {
        const systemTheme = getSystemTheme()
        if (systemTheme === 'dark') {
            root.classList.add('dark')
        }
    } else if (theme === 'dark') {
        root.classList.add('dark')
    }

    return theme
}

// initialize theme
setTheme('system') 