"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--width": "360px",
        } as React.CSSProperties
      }
      position="top-right"
      expand={false}
      richColors
      closeButton
      duration={1500}
      toastOptions={{
        style: {
          marginTop: "80px", // Add space to avoid header overlap
          cursor: "pointer", // Make toasts clickable
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
