import { useState, KeyboardEvent } from 'react'
import './Goose.css'

interface GooseProps {
  onTap: () => void
  disabled: boolean
  isAnimating?: boolean
}

export function Goose({ onTap, disabled, isAnimating: externalAnimating }: GooseProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleTap = () => {
    if (disabled) {
      return
    }

    // Trigger animation
    setIsAnimating(true)
    setTimeout(() => {
      setIsAnimating(false)
    }, 300)

    // Call onTap callback
    onTap()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) {
      return
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleTap()
    }
  }

  const animating = externalAnimating || isAnimating

  return (
    <div
      className={`goose ${disabled ? 'goose--disabled' : ''} ${animating ? 'goose--animating' : ''}`}
      onClick={handleTap}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={disabled ? 'Round not active, cannot tap' : 'Tap the goose to score points. Press Spacebar or Enter when focused.'}
      aria-disabled={disabled}
      aria-live="polite"
    >
      <div className="goose__art">
        <div className="goose__line">░░░░░░░░░░░░░</div>
        <div className="goose__line">░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░</div>
        <div className="goose__line">░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░</div>
        <div className="goose__line">░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░</div>
        <div className="goose__line">░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░</div>
        <div className="goose__line">░░▒▒▒▒░░░░▓▓▓▓▓▓▓▓▓▓▓▓░░░░▒▒▒▒░░</div>
        <div className="goose__line">░░▒▒▒▒▒▒▒▒░░░░░░░░░░░░▒▒▒▒▒▒▒▒░░</div>
        <div className="goose__line">░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░</div>
        <div className="goose__line">░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░</div>
        <div className="goose__line">░░░░░░░░░░░░░░░░░░░░░░░░░</div>
      </div>
    </div>
  )
}

