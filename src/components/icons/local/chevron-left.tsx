import React from "react";
import { SvgXml, type SvgProps } from "react-native-svg";

const LocalChevronLeftIcon = (props: Omit<SvgProps, "xml">) => {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15 18C15 18 9.00001 13.5811 9 12C8.99999 10.4188 15 6 15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  return <SvgXml xml={xml} {...props} />;
};

export default LocalChevronLeftIcon;
