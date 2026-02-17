import * as React from "react"
import { SvgXml, type SvgProps } from "react-native-svg"

function LocalRightToLeftListNumberIcon(props: Omit<SvgProps, "xml">) {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M18 15H21V18H18.0003V21H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 3H19.5V9M19.5 9H18M19.5 9H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 6L13 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M3 12L13 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M3 18L13 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`

  return <SvgXml xml={xml} {...props} />
}

export default LocalRightToLeftListNumberIcon
