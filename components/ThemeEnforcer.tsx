'use client'

import { useEffect } from 'react'

export function ThemeEnforcer() {
  useEffect(() => {
    // Força o tema escuro via JavaScript
    const html = document.documentElement
    html.classList.add('dark')
    html.style.colorScheme = 'dark'
    html.style.backgroundColor = 'hsl(222.2, 84%, 4.9%)'
    
    const body = document.body
    body.style.backgroundColor = 'hsl(222.2, 84%, 4.9%)'
    body.style.color = 'hsl(210, 40%, 98%)'
    
    // Aplica em todos os elementos principais
    const main = document.querySelector('main')
    if (main) {
      main.style.backgroundColor = 'hsl(222.2, 84%, 4.9%)'
      main.style.color = 'hsl(210, 40%, 98%)'
    }
    
    // Observa mudanças no DOM e aplica tema escuro
    const observer = new MutationObserver(() => {
      html.classList.add('dark')
      html.style.colorScheme = 'dark'
      html.style.backgroundColor = 'hsl(222.2, 84%, 4.9%)'
      body.style.backgroundColor = 'hsl(222.2, 84%, 4.9%)'
      body.style.color = 'hsl(210, 40%, 98%)'
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
    
    return () => {
      observer.disconnect()
    }
  }, [])
  
  return null
}

