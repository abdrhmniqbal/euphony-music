import React from "react";
import { SvgXml, type SvgProps } from "react-native-svg";

const LocalArrowDown02Icon = (props: Omit<SvgProps, "xml">) => {
  const xml = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 18.502V5.00195" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M18 13.002C18 13.002 13.5811 19.0019 12 19.002C10.4188 19.002 6 13.002 6 13.002" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

  return <SvgXml xml={xml} {...props} />;
};

export default LocalArrowDown02Icon;
