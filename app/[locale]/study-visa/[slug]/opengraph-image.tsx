import { countryOg, ogSize } from "@/components/country/og";
export const size = ogSize;
export const contentType = "image/png";
export const alt = "Visafeast visa guide";
export default async function Image({ params }: { params: Promise<{ slug: string }> }) { return countryOg((await params).slug); }
