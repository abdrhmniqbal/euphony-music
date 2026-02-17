import * as React from "react"
import { SvgXml, type SvgProps } from "react-native-svg"

function LocalSettingsIcon(props: Omit<SvgProps, "xml">) {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15.5 12a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" stroke="currentColor" stroke-width="2"/><path d="M22 13.967v-3.934c-2.857 0-4.714-3.103-3.268-5.566L15.268 2.5c-1.464 2.494-5.07 2.494-6.534 0L5.27 4.467C6.716 6.93 4.857 10.033 2 10.033v3.934c2.857 0 4.714 3.103 3.268 5.566L8.732 21.5c1.465-2.495 5.073-2.495 6.538 0l3.464-1.967c-1.447-2.463.41-5.566 3.266-5.566" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`

  return <SvgXml xml={xml} {...props} />
}

export default LocalSettingsIcon
