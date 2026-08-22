export interface AppToastOptions {
  title: string
  description?: string
  variant?: "accent" | "danger" | "default" | "success" | "warning"
}

interface AppToastAdapter {
  show: (options: AppToastOptions) => void
}

let appToastAdapter: AppToastAdapter | null = null

export function setAppToastAdapter(adapter: AppToastAdapter | null) {
  appToastAdapter = adapter
}

export function showAppToast(title: string, description?: string) {
  appToastAdapter?.show({ title, description, variant: "accent" })
}
