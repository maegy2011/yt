'use client'

import { useEffect, useState } from 'react'

interface ClientOnlyDateProps {
  date: Date | string | number
  options?: Intl.DateTimeFormatOptions
  className?: string
}

export function ClientOnlyDate({ date, options, className }: ClientOnlyDateProps) {
  const [isClient, setIsClient] = useState(false)
  const [formattedDate, setFormattedDate] = useState('')

  useEffect(() => {
    setIsClient(true)
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    setFormattedDate(dateObj.toLocaleDateString(undefined, options))
  }, [date, options])

  if (!isClient) {
    return <span className={className}>Loading...</span>
  }

  return <span className={className}>{formattedDate}</span>
}

interface ClientOnlyTimeProps {
  date: Date | string | number
  options?: Intl.DateTimeFormatOptions
  className?: string
}

export function ClientOnlyTime({ date, options, className }: ClientOnlyTimeProps) {
  const [isClient, setIsClient] = useState(false)
  const [formattedTime, setFormattedTime] = useState('')

  useEffect(() => {
    setIsClient(true)
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    setFormattedTime(dateObj.toLocaleTimeString(undefined, options))
  }, [date, options])

  if (!isClient) {
    return <span className={className}>--:--</span>
  }

  return <span className={className}>{formattedTime}</span>
}

interface ClientOnlyTimestampProps {
  timestamp?: number
  className?: string
}

export function ClientOnlyTimestamp({ timestamp, className }: ClientOnlyTimestampProps) {
  const [isClient, setIsClient] = useState(false)
  const [currentTimestamp, setCurrentTimestamp] = useState(0)

  useEffect(() => {
    setIsClient(true)
    setCurrentTimestamp(timestamp || Date.now())
  }, [timestamp])

  if (!isClient) {
    return <span className={className}>-</span>
  }

  return <span className={className}>{currentTimestamp}</span>
}