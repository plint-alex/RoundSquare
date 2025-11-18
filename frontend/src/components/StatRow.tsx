import { ReactNode } from 'react'
import './StatRow.css'

interface StatRowProps {
  label: string
  value: ReactNode
  className?: string
  'aria-label'?: string
}

/**
 * StatRow component for consistent stat displays with label and value.
 * Provides accessible structure for screen readers.
 */
export function StatRow({ label, value, className = '', 'aria-label': ariaLabel }: StatRowProps) {
  return (
    <div
      className={`stat-row ${className}`}
      role="listitem"
      aria-label={ariaLabel || `${label}: ${value}`}
    >
      <span className="stat-row__label">{label}</span>
      <span className="stat-row__value">{value}</span>
    </div>
  )
}


