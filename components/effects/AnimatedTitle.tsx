'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'

interface AnimatedTitleProps {
  titles: string[]
  interval?: number
  className?: string
}

export function AnimatedTitle({ titles, interval = 2000, className = '' }: AnimatedTitleProps) {
  const [titleNumber, setTitleNumber] = useState(0)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0)
      } else {
        setTitleNumber(titleNumber + 1)
      }
    }, interval)
    return () => clearTimeout(timeoutId)
  }, [titleNumber, titles, interval])

  return (
    <span className={`relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1 ${className}`}>
      &nbsp;
      {titles.map((title, index) => (
        <motion.span
          key={index}
          className="absolute font-semibold text-blue-600"
          initial={{ opacity: 0, y: -100 }}
          transition={{ type: 'spring', stiffness: 50 }}
          animate={
            titleNumber === index
              ? { y: 0, opacity: 1 }
              : { y: titleNumber > index ? -150 : 150, opacity: 0 }
          }
        >
          {title}
        </motion.span>
      ))}
    </span>
  )
}
