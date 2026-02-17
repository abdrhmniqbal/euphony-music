import * as React from "react"
import { SvgXml, type SvgProps } from "react-native-svg"

function LocalRepeatOneIcon(props: Omit<SvgProps, "xml">) {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12.5 15V9L11 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M20.7453 8C21.5362 9.13383 22 10.5128 22 12C22 15.866 18.866 19 15 19H5.5L8.5 21.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.25469 16C2.46381 14.8662 2 13.4872 2 12C2 8.13401 5.13401 5 9 5H18.5L15.5 2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`

  return <SvgXml xml={xml} {...props} />
}

export default LocalRepeatOneIcon
