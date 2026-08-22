import { useEffect } from "react"
import { Toast, useToast } from "heroui-native"
import { setAppToastAdapter } from "@/modules/ui/toast"

export function AppToastRuntime() {
  const { toast } = useToast()

  useEffect(() => {
    setAppToastAdapter({
      show: ({ title, description, variant = "default" }) => {
        toast.show({
          duration: 2000,
          component: (props) => (
            <Toast {...props} variant={variant} placement="bottom">
              <Toast.Title className="text-sm font-semibold text-foreground">{title}</Toast.Title>
              {description ? (
                <Toast.Description className="text-xs text-muted">{description}</Toast.Description>
              ) : null}
            </Toast>
          ),
        })
      },
    })

    return () => {
      setAppToastAdapter(null)
    }
  }, [toast])

  return null
}
