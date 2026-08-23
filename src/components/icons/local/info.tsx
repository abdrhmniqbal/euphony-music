import React from "react";
import { SvgXml, type SvgProps } from "react-native-svg";

const LocalInfoIcon = (props: Omit<SvgProps, "xml">) => {
  const xml = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="12" cy="11.9999" r="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M12 15.9999L12 11.9999" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M11.875 8.24994L12 8.24994M11.75 8.24994C11.75 8.11187 11.8619 7.99994 12 7.99994C12.1381 7.99994 12.25 8.11187 12.25 8.24994C12.25 8.38801 12.1381 8.49994 12 8.49994C11.8619 8.49994 11.75 8.38801 11.75 8.24994Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

  return <SvgXml xml={xml} {...props} />;
};

export default LocalInfoIcon;
