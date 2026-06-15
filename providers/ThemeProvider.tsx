'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ThemeProviderProps } from 'next-themes'

const ThemeProvider = ({ children, ...props }: ThemeProviderProps) => (
  <NextThemesProvider attribute="class" defaultTheme="system" enableSystem {...props}>
    {children}
  </NextThemesProvider>
)

export default ThemeProvider
