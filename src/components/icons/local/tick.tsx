import React from "react";
import { SvgXml, type SvgProps } from "react-native-svg";

const LocalTickIcon = (props: Omit<SvgProps, "xml">) => {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4.25 13.5L8.75 18L19.75 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  return <SvgXml xml={xml} {...props} />;
};

export default LocalTickIcon;
