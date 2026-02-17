import * as React from "react"
import { SvgXml, type SvgProps } from "react-native-svg"

function LocalAddIcon(props: Omit<SvgProps, "xml">) {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12.001 5.00003V19.002" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M19.002 12.002L4.99998 12.002" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`

  return <SvgXml xml={xml} {...props} />
}

export default LocalAddIcon
