'use client'
import { useState, useCallback } from 'react'

// Replace with your actual Formspree form ID from https://formspree.io
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID'

type FormStatus = 'idle' | 'loading' | 'success' | 'error'

interface NewsletterFormProps {
  /** Placeholder text for the email input */
  placeholder?: string
  /** Button label */
  buttonLabel?: string
  /** CSS class overrides for the outer wrapper */
  className?: string
  /** Show a description below the form */
  description?: string
}

export function NewsletterForm({
  placeholder = 'your@email.com',
  buttonLabel = 'Subscribe',
  className = '',
  description,
}: NewsletterFormProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<FormStatus>('idle')

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (!email) return

      setStatus('loading')

      try {
        const res = await fetch(FORMSPREE_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ email }),
        })

        if (res.ok) {
          setStatus('success')
          setEmail('')
        } else {
          setStatus('error')
        }
      } catch {
        setStatus('error')
      }
    },
    [email]
  )

  return (
    <div className={className}>
      {status === 'success' ? (
        <div className="text-green-400 font-medium text-center">
          You're in! Check your inbox.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={placeholder}
            required
            disabled={status === 'loading'}
            className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-medium transition text-white"
          >
            {status === 'loading' ? 'Subscribing...' : buttonLabel}
          </button>
        </form>
      )}
      {status === 'error' && (
        <p className="text-red-400 text-sm mt-2 text-center">
          Something went wrong, try again.
        </p>
      )}
      {description && status !== 'success' && (
        <p className="text-slate-400 text-sm mt-2 text-center">{description}</p>
      )}
    </div>
  )
}

export default NewsletterForm
