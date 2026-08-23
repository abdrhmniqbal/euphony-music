import React from "react";
import { SvgXml, type SvgProps } from "react-native-svg";

const LocalChevronLeftIcon = (props: Omit<SvgProps, "xml">) => {
  const xml = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15 18C15 18 9.00001 13.5811 9 12C8.99999 10.4188 15 6 15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

  return <SvgXml xml={xml} {...props} />;
};

export default LocalChevronLeftIcon;
