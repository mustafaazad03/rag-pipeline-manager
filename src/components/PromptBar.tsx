"use client"

type Props = {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  disabled?: boolean
}

export default function PromptBar({ value, onChange, onSend, disabled }: Props) {
  return (
    <div className="flex items-center gap-3 mt-4">
      <input
        className="flex-1 p-2 border rounded"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Ask a question about your documents"
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSend()
        }}
      />
      <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={onSend} disabled={disabled}>
        Send
      </button>
    </div>
  )
}
