import { ReactNode, HTMLAttributes, KeyboardEvent } from 'react'
import './Card.css'

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> {
  children: ReactNode
  accentColor?: string
  onClick?: () => void
  clickable?: boolean
  header?: ReactNode
  footer?: ReactNode
  className?: string
}

/**
 * Generic Card component with optional accent bar, header, content, footer, and clickable variant.
 * Provides consistent styling and accessibility features across the application.
 */
export function Card({
  children,
  accentColor,
  onClick,
  clickable = false,
  header,
  footer,
  className = '',
  ...props
}: CardProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (clickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      onClick?.()
    }
  }

  const cardClasses = [
    'card',
    clickable && 'card--clickable',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const cardProps = clickable
    ? {
        role: 'button',
        tabIndex: 0,
        onClick,
        onKeyDown: handleKeyDown,
        'aria-label': props['aria-label'] || 'Click to view details',
      }
    : {}

  return (
    <div className={cardClasses} {...cardProps} {...props}>
      {accentColor && (
        <div className="card__accent" style={{ backgroundColor: accentColor }} aria-hidden="true" />
      )}
      <div className="card__content">
        {header && <div className="card__header">{header}</div>}
        <div className="card__body">{children}</div>
        {footer && <div className="card__footer">{footer}</div>}
      </div>
    </div>
  )
}


