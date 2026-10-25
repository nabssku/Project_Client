'use client'

import { useEffect } from 'react'

interface FontLoaderProps {
  fontBody?: string
  fontDisplay?: string
}

const FONT_OPTIONS = {
  body: {
    'DM Sans': 'DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700',
    'Inter': 'Inter:wght@400;500;600;700',
    'Poppins': 'Poppins:wght@400;500;600;700',
    'Open Sans': 'Open+Sans:wght@400;500;600;700',
    'Nunito': 'Nunito:wght@400;500;600;700',
    'Work Sans': 'Work+Sans:wght@400;500;600;700',
  },
  display: {
    'Playfair Display': 'Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500',
    'Libre Baskerville': 'Libre+Baskerville:ital,wght@0,400;0,700;1,400',
    'Cormorant Garamond': 'Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500',
    'Merriweather': 'Merriweather:ital,wght@0,400;0,700;1,400;1,700',
    'Lora': 'Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500',
    'Crimson Text': 'Crimson+Text:ital,wght@0,400;0,600;0,700;1,400',
  },
}

export default function FontLoader({ fontBody = 'DM Sans', fontDisplay = 'Playfair Display' }: FontLoaderProps) {
  useEffect(() => {
    const bodyFont = FONT_OPTIONS.body[fontBody as keyof typeof FONT_OPTIONS.body] || FONT_OPTIONS.body['DM Sans']
    const displayFont = FONT_OPTIONS.display[fontDisplay as keyof typeof FONT_OPTIONS.display] || FONT_OPTIONS.display['Playfair Display']

    // Remove existing font links
    const existingLinks = document.querySelectorAll('link[data-font-loader]')
    existingLinks.forEach(link => link.remove())

    // Load fonts from Google Fonts
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${bodyFont}&family=${displayFont}&display=swap`
    link.setAttribute('data-font-loader', 'true')
    document.head.appendChild(link)

    // Update CSS variables
    const fontBodyFamily = fontBody.includes(' ') ? `"${fontBody}"` : fontBody
    const fontDisplayFamily = fontDisplay.includes(' ') ? `"${fontDisplay}"` : fontDisplay

    document.documentElement.style.setProperty('--font-sans', `${fontBodyFamily}, sans-serif`)
    document.documentElement.style.setProperty('--font-display', `${fontDisplayFamily}, serif`)
  }, [fontBody, fontDisplay])

  return null
}
