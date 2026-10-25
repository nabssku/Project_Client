'use client'

import { useEffect } from 'react'

interface DynamicFontLoaderProps {
  fontBody: string
  fontDisplay: string
}

const FONT_MAP: Record<string, string> = {
  'DM Sans': 'DM+Sans:wght@400;500;600;700',
  'Inter': 'Inter:wght@400;500;600;700',
  'Poppins': 'Poppins:wght@400;500;600;700',
  'Open Sans': 'Open+Sans:wght@400;500;600;700',
  'Nunito': 'Nunito:wght@400;500;600;700',
  'Work Sans': 'Work+Sans:wght@400;500;600;700',
  'Playfair Display': 'Playfair+Display:wght@400;500;600;700&display=swap',
  'Libre Baskerville': 'Libre+Baskerville:wght@400;700',
  'Cormorant Garamond': 'Cormorant+Garamond:wght@400;500;600;700',
  'Merriweather': 'Merriweather:wght@400;700',
  'Lora': 'Lora:wght@400;500;600;700',
  'Crimson Text': 'Crimson+Text:wght@400;600;700',
}

export default function DynamicFontLoader({ fontBody, fontDisplay }: DynamicFontLoaderProps) {
  useEffect(() => {
    const bodyParam = FONT_MAP[fontBody] || FONT_MAP['DM Sans']
    const displayParam = FONT_MAP[fontDisplay] || FONT_MAP['Playfair Display']

    const url = `https://fonts.googleapis.com/css2?family=${bodyParam}&family=${displayParam}&display=swap`

    // Check if link already exists
    const existingLink = document.querySelector(`link[href="${url}"]`)
    if (existingLink) return

    // Remove old font links
    document.querySelectorAll('link[data-dynamic-font]').forEach(el => el.remove())

    // Add new font link
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = url
    link.setAttribute('data-dynamic-font', 'true')
    document.head.appendChild(link)

    // Update CSS variables
    document.documentElement.style.setProperty('--font-sans', `"${fontBody}", sans-serif`)
    document.documentElement.style.setProperty('--font-display', `"${fontDisplay}", serif`)
  }, [fontBody, fontDisplay])

  return null
}
