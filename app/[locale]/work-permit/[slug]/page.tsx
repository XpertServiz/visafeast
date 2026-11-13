import { detailRoute } from "@/components/country/kindRoutes";
const r = detailRoute("work");
export const generateMetadata = r.generateMetadata;
export const generateStaticParams = r.generateStaticParams;
export const revalidate = 3600;
export default r.Page;
