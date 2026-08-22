import React from "react";
import { SvgXml, type SvgProps } from "react-native-svg";

const LocalTick02Icon = (props: Omit<SvgProps, "xml">) => {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 14L8.5 17.5L19 6.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  return <SvgXml xml={xml} {...props} />;
};

export default LocalTick02Icon;
