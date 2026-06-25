import React from "react"
import { SvgXml, type SvgProps } from "react-native-svg"

const LocalQueue01Icon = (props: Omit<SvgProps, "xml">) => {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21 14C21 15.4001 21 16.1002 20.7275 16.635C20.4878 17.1054 20.1054 17.4878 19.635 17.7275C19.1002 18 18.4001 18 17 18H7C5.59987 18 4.8998 18 4.36502 17.7275C3.89462 17.4878 3.51217 17.1054 3.27248 16.635C3 16.1002 3 15.4001 3 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 14H18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10H18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 6H18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`

  return <SvgXml xml={xml} {...props} />
}

export default LocalQueue01Icon
