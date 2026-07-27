import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/libs/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-foreground text-background hover:opacity-90',
        white: 'bg-white text-black border border-black/10 hover:bg-black/5',
        black: 'bg-black text-white hover:bg-black/80',
        yellow: 'bg-brand-yellow text-brand-navy hover:opacity-90',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  },
)

type ButtonProps = VariantProps<typeof buttonVariants> & {
  children: string
  Icon?: React.ComponentType
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const Button = ({ children, Icon, onClick, variant, disabled, type = 'button' }: ButtonProps) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={cn(buttonVariants({ variant }))}
  >
    <span>{children}</span>
    {Icon && <Icon />}
  </button>
)

export default Button
export { buttonVariants }
