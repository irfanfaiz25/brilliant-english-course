import { Poppins } from "next/font/google";

/** Brand typeface (DESIGN.md § 2.2). Shared by every root layout. */
export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});
