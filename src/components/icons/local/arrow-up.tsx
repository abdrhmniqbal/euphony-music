import * as React from "react"
import { SvgXml, type SvgProps } from "react-native-svg"

function LocalArrowUpIcon(props: Omit<SvgProps, "xml">) {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M18 11L12 5L6 11M12 5.5V19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`

  return <SvgXml xml={xml} {...props} />
}

export default LocalArrowUpIcon
