import { cn } from '@/lib/utils'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'w-4 h-4 border-[1.5px]',
  md: 'w-6 h-6 border-2',
  lg: 'w-9 h-9 border-2',
}

export default function Spinner({ size = 'md', className }: Props) {
  return (
    <div
      className={cn(
        'rounded-full border-gold/25 border-t-gold animate-spin',
        sizes[size],
        className
      )}
    />
  )
}

export function PageSpinner() {
  return (
    <div className="min-h-screen bg-lenz-bg flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}
