import * as React from "react"
import { SvgXml, type SvgProps } from "react-native-svg"

function LocalMusicNoteIcon(props: Omit<SvgProps, "xml">) {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="8" cy="17" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 17V3C14.3333 3 19.2 4.4 20 10C19 9 15 7 12 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`

  return <SvgXml xml={xml} {...props} />
}

export default LocalMusicNoteIcon
