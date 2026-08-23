import React from "react";
import { SvgXml, type SvgProps } from "react-native-svg";

const LocalArrowUp02Icon = (props: Omit<SvgProps, "xml">) => {
  const xml = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 5.5V19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M18 11C18 11 13.5811 5.00001 12 5C10.4188 4.99999 6 11 6 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

  return <SvgXml xml={xml} {...props} />;
};

export default LocalArrowUp02Icon;
