import { Toast, useToast } from "heroui-native"
import { useCallback } from "react"

export function useComingSoonToast() {
  const { toast } = useToast()

  const showComingSoon = useCallback(
    (featureLabel?: string) => {
      toast.show({
        duration: 1800,
        component: (props) => (
          <Toast
            {...props}
            variant="accent"
            placement="top"
            style={{ zIndex: 2200, elevation: 2200 }}
          >
            <Toast.Title className="text-sm font-semibold">Coming soon</Toast.Title>
            {featureLabel ? (
              <Toast.Description className="text-xs text-muted">{featureLabel}</Toast.Description>
            ) : null}
          </Toast>
        ),
      })
    },
    [toast]
  )

  return { showComingSoon }
}
