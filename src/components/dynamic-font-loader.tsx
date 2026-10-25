"use client"

import { useEffect } from 'react'

interface DynamicFontLoaderProps {
  fontBody?: string
  fontDisplay?: string
}

const FONT_OPTIONS = {
  body: [
    'DM Sans',
    'Inter',
    'Poppins',
    'Open Sans',
    'Nunito',
    'Work Sans'
  ],
  display: [
    'Playfair Display',
    'Libre Baskerville',
    'Cormorant Garamond',
    'Merriweather',
    'Lora',
    'Crimson Text'
  ]
}

export function DynamicFontLoader({ fontBody = 'DM Sans', fontDisplay = 'Playfair Display' }: DynamicFontLoaderProps) {
  useEffect(() => {
    // Remove existing font links
    const existingLinks = document.querySelectorAll('link[data-font-loader]')
    existingLinks.forEach(link => link.remove())

    // Build Google Fonts URL
    const bodyFont = fontBody.replace(/ /g, '+')
    const displayFont = fontDisplay.replace(/ /g, '+')

    const fontUrl = `https://fonts.googleapis.com/css2?family=${bodyFont}:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=${displayFont}:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap`

    // Create and append new font link
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = fontUrl
    link.setAttribute('data-font-loader', 'true')
    document.head.appendChild(link)

    // Update CSS variables
    document.documentElement.style.setProperty('--font-sans', fontBody)
    document.documentElement.style.setProperty('--font-display', fontDisplay)
  }, [fontBody, fontDisplay])

  return null
}
