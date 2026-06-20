import React from "react";
import { SvgXml, type SvgProps } from "react-native-svg";

const LocalArrowLeftIcon = (props: Omit<SvgProps, "xml">) => {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M11 18L5 12L11 6M5.5 12L19 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  return <SvgXml xml={xml} {...props} />;
};

export default LocalArrowLeftIcon;
