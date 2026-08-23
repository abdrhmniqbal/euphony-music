import React from "react";
import { SvgXml, type SvgProps } from "react-native-svg";

const LocalCancel01Icon = (props: Omit<SvgProps, "xml">) => {
  const xml = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M18 6L6.00081 17.9992M17.9992 18L6 6.00085" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

  return <SvgXml xml={xml} {...props} />;
};

export default LocalCancel01Icon;
