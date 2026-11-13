import { hubRoute } from "@/components/country/kindRoutes";
const r = hubRoute("work");
export const generateMetadata = r.generateMetadata;
export const revalidate = 3600;
export default r.Page;
