import React from "react"
import { SvgXml, type SvgProps } from "react-native-svg"

const LocalChevronRightIcon = (props: Omit<SvgProps, "xml">) => {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9.00005 18C9.00005 18 15 13.5811 15 12C15 10.4188 9 6 9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`

  return <SvgXml xml={xml} {...props} />
}

export default LocalChevronRightIcon
