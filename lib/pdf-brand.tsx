import React from "react";
import { Image, View } from "@react-pdf/renderer";
import { MARK_LIGHT_DATA, PDF_MARK, PDF_WORD, WORDMARK_LIGHT_DATA } from "./brand-data";

/** The logo for the top bar of a PDF (white-and-gold, to sit on the navy bar). `height` is the height of the mark in points. */
export function PdfBrand({ height = 28 }: { height?: number }) {
  const word = height * 0.46;
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Image src={MARK_LIGHT_DATA} style={{ height, width: (height * PDF_MARK.w) / PDF_MARK.h }} />
      <Image src={WORDMARK_LIGHT_DATA} style={{ height: word, width: (word * PDF_WORD.w) / PDF_WORD.h, marginLeft: height * 0.26 }} />
    </View>
  );
}
