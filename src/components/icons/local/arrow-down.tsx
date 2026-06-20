import React from "react";
import { SvgXml, type SvgProps } from "react-native-svg";

const LocalArrowDownIcon = (props: Omit<SvgProps, "xml">) => {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M18 13L12 19L6 13M12 18.5V5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  return <SvgXml xml={xml} {...props} />;
};

export default LocalArrowDownIcon;
