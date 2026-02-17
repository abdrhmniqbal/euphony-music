import { View, type ViewProps } from "react-native"
import { cn, tv, type VariantProps } from "tailwind-variants"

const cardStyles = tv({
  base: "rounded-xl border",
  variants: {
    tone: {
      surface: "bg-surface border-border",
      default: "bg-default border-border",
      ghost: "bg-transparent border-transparent",
    },
    padding: {
      none: "p-0",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
    },
  },
  defaultVariants: {
    tone: "surface",
    padding: "md",
  },
})

type CardVariants = VariantProps<typeof cardStyles>

type CardProps = ViewProps & CardVariants

export function Card({ tone, padding, className, ...props }: CardProps) {
  return (
    <View className={cn(cardStyles({ tone, padding }), className)} {...props} />
  )
}
