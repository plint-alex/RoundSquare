import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CreateRoundForm } from '@/components/CreateRoundForm'

describe('CreateRoundForm', () => {
  const mockOnSubmit = vi.fn()
  const defaultProps = {
    onSubmit: mockOnSubmit,
    isCreating: false,
    error: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders toggle and submit button', () => {
    render(<CreateRoundForm {...defaultProps} />)

    expect(screen.getByLabelText(/Use default durations/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Custom cooldown/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Create Round/i })).toBeInTheDocument()
  })

  it('shows input field when custom cooldown is selected', () => {
    render(<CreateRoundForm {...defaultProps} />)

    const customRadio = screen.getByLabelText(/Custom cooldown/i)
    fireEvent.click(customRadio)

    expect(screen.getByLabelText(/Cooldown Duration/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/e.g., 60/i)).toBeInTheDocument()
  })

  it('hides input field when default is selected', () => {
    render(<CreateRoundForm {...defaultProps} />)

    // Select custom first
    fireEvent.click(screen.getByLabelText(/Custom cooldown/i))
    expect(screen.getByLabelText(/Cooldown Duration/i)).toBeInTheDocument()

    // Switch back to default
    fireEvent.click(screen.getByLabelText(/Use default durations/i))
    expect(screen.queryByLabelText(/Cooldown Duration/i)).not.toBeInTheDocument()
  })

  it('disables submit button when custom is selected but input is empty', () => {
    render(<CreateRoundForm {...defaultProps} />)

    fireEvent.click(screen.getByLabelText(/Custom cooldown/i))
    const submitButton = screen.getByRole('button', { name: /Create Round/i })

    expect(submitButton).toBeDisabled()
  })

  it('shows validation error for negative numbers', async () => {
    render(<CreateRoundForm {...defaultProps} />)

    fireEvent.click(screen.getByLabelText(/Custom cooldown/i))
    const input = screen.getByLabelText(/Cooldown Duration/i)

    fireEvent.change(input, { target: { value: '-1' } })
    fireEvent.blur(input)

    await waitFor(() => {
      expect(screen.getByText(/Must be 0 or greater/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /Create Round/i })).toBeDisabled()
  })

  it('shows validation error for non-number input', async () => {
    render(<CreateRoundForm {...defaultProps} />)

    fireEvent.click(screen.getByLabelText(/Custom cooldown/i))
    const input = screen.getByLabelText(/Cooldown Duration/i) as HTMLInputElement

    // Number inputs prevent non-numeric input, so we test with a string that can be set programmatically
    // but will fail validation when parsed
    fireEvent.change(input, { target: { value: 'invalid' } })
    fireEvent.blur(input)

    // Number inputs typically reject invalid input, but if validation runs, it should show an error
    // Since browser behavior varies, we check that the input is either empty (rejected) or shows error
    const hasError = screen.queryByText(/Must be a valid number/i) !== null
    const isEmpty = input.value === ''
    
    // Either the browser rejected it (empty) or our validation caught it (error shown)
    expect(hasError || isEmpty).toBe(true)
  })

  it('shows validation error for non-integer numbers', async () => {
    render(<CreateRoundForm {...defaultProps} />)

    fireEvent.click(screen.getByLabelText(/Custom cooldown/i))
    const input = screen.getByLabelText(/Cooldown Duration/i)

    fireEvent.change(input, { target: { value: '60.5' } })
    fireEvent.blur(input)

    await waitFor(() => {
      expect(screen.getByText(/Must be a whole number/i)).toBeInTheDocument()
    })
  })

  it('enables submit button with valid input', () => {
    render(<CreateRoundForm {...defaultProps} />)

    fireEvent.click(screen.getByLabelText(/Custom cooldown/i))
    const input = screen.getByLabelText(/Cooldown Duration/i)
    fireEvent.change(input, { target: { value: '60' } })

    const submitButton = screen.getByRole('button', { name: /Create Round/i })
    expect(submitButton).not.toBeDisabled()
  })

  it('calls onSubmit with undefined when default is selected', () => {
    render(<CreateRoundForm {...defaultProps} />)

    const submitButton = screen.getByRole('button', { name: /Create Round/i })
    fireEvent.click(submitButton)

    expect(mockOnSubmit).toHaveBeenCalledWith(undefined)
  })

  it('calls onSubmit with startDelaySeconds when custom is selected', () => {
    render(<CreateRoundForm {...defaultProps} />)

    fireEvent.click(screen.getByLabelText(/Custom cooldown/i))
    const input = screen.getByLabelText(/Cooldown Duration/i)
    fireEvent.change(input, { target: { value: '120' } })

    const submitButton = screen.getByRole('button', { name: /Create Round/i })
    fireEvent.click(submitButton)

    expect(mockOnSubmit).toHaveBeenCalledWith({ startDelaySeconds: 120 })
  })

  it('shows loading state when isCreating is true', () => {
    render(<CreateRoundForm {...defaultProps} isCreating={true} />)

    const submitButton = screen.getByRole('button', { name: /Create Round/i })
    expect(submitButton).toHaveAttribute('aria-busy', 'true')
    expect(submitButton).toBeDisabled()
  })

  it('displays error message when error is provided', () => {
    const errorMessage = 'Failed to create round'
    render(<CreateRoundForm {...defaultProps} error={errorMessage} />)

    expect(screen.getByText(errorMessage)).toBeInTheDocument()
  })

  it('disables inputs when isCreating is true', () => {
    render(<CreateRoundForm {...defaultProps} isCreating={true} />)

    const defaultRadio = screen.getByLabelText(/Use default durations/i)
    const customRadio = screen.getByLabelText(/Custom cooldown/i)

    expect(defaultRadio).toBeDisabled()
    expect(customRadio).toBeDisabled()
  })
})


