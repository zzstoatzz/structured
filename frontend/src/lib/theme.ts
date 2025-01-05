export type theme = 'dark' | 'light'

export function getSystemTheme(): theme {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function setTheme(theme: theme) {
    const root = window.document.documentElement
    root.classList.remove('dark')

    if (theme === 'dark') {
        root.classList.add('dark')
    }

    return theme
}

// initialize theme
setTheme(getSystemTheme()) 