import * as React from "react"
import { SvgXml, type SvgProps } from "react-native-svg"

function LocalChevronRightIcon(props: Omit<SvgProps, "xml">) {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9.00005 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-miterlimit="16" stroke-linecap="round" stroke-linejoin="round"/></svg>`

  return <SvgXml xml={xml} {...props} />
}

export default LocalChevronRightIcon
