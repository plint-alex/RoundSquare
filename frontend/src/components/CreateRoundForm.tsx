import { useState, FormEvent } from 'react'
import { Button } from '@/components/Button'
import './CreateRoundForm.css'

interface CreateRoundFormProps {
  onSubmit: (data?: { startDelaySeconds?: number }) => void
  isCreating: boolean
  error: string | null
}

export function CreateRoundForm({ onSubmit, isCreating, error }: CreateRoundFormProps) {
  const [useDefault, setUseDefault] = useState(true)
  const [startDelaySeconds, setStartDelaySeconds] = useState<string>('')
  const [fieldError, setFieldError] = useState<string | null>(null)

  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isDefault = e.target.value === 'default'
    setUseDefault(isDefault)
    if (isDefault) {
      setStartDelaySeconds('')
      setFieldError(null)
    }
  }

  const validateInput = (value: string): string | null => {
    if (value.trim() === '') {
      return 'Cooldown duration is required'
    }

    const num = Number(value)
    if (isNaN(num)) {
      return 'Must be a valid number'
    }

    if (num < 0) {
      return 'Must be 0 or greater'
    }

    // Check if it's an integer (optional, but good to validate)
    if (!Number.isInteger(num)) {
      return 'Must be a whole number'
    }

    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setStartDelaySeconds(value)

    // Clear error when user starts typing
    if (fieldError) {
      setFieldError(null)
    }

    // Validate on blur or when value changes
    if (value.trim() !== '') {
      const error = validateInput(value)
      setFieldError(error)
    }
  }

  const handleBlur = () => {
    if (startDelaySeconds.trim() !== '') {
      const error = validateInput(startDelaySeconds)
      setFieldError(error)
    }
  }

  const isFormValid = useDefault || (!fieldError && startDelaySeconds.trim() !== '')
  const isSubmitDisabled = !isFormValid || isCreating

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!useDefault) {
      // Validate one more time before submitting
      const error = validateInput(startDelaySeconds)
      if (error) {
        setFieldError(error)
        return
      }
    }

    const data = useDefault
      ? undefined
      : { startDelaySeconds: Number.parseInt(startDelaySeconds, 10) }

    onSubmit(data)
  }

  return (
    <form className="create-round-form" onSubmit={handleSubmit}>
      <div className="create-round-form__toggle-group">
        <label className="create-round-form__toggle-label">
          <input
            type="radio"
            name="duration-type"
            value="default"
            checked={useDefault}
            onChange={handleToggleChange}
            disabled={isCreating}
          />
          <span>Use default durations</span>
        </label>
        <label className="create-round-form__toggle-label">
          <input
            type="radio"
            name="duration-type"
            value="custom"
            checked={!useDefault}
            onChange={handleToggleChange}
            disabled={isCreating}
          />
          <span>Custom cooldown</span>
        </label>
      </div>

      {!useDefault && (
        <div className="create-round-form__field">
          <label htmlFor="startDelaySeconds" className="create-round-form__label">
            Cooldown Duration (seconds)
          </label>
          <input
            id="startDelaySeconds"
            type="number"
            min="0"
            step="1"
            className={`create-round-form__input ${fieldError ? 'create-round-form__input--error' : ''}`}
            value={startDelaySeconds}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={isCreating}
            placeholder="e.g., 60"
            aria-invalid={fieldError ? 'true' : 'false'}
            aria-describedby={fieldError ? 'field-error' : undefined}
          />
          {fieldError && (
            <span id="field-error" className="create-round-form__field-error" role="alert">
              {fieldError}
            </span>
          )}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        fullWidth
        isLoading={isCreating}
        disabled={isSubmitDisabled}
      >
        Create Round
      </Button>

      {error && (
        <div className="create-round-form__error" role="alert">
          {error}
        </div>
      )}
    </form>
  )
}

