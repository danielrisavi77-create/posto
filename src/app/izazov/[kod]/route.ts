import { NextResponse, type NextRequest } from "next/server";
import { KOD, KOLACIC_IZAZOV } from "@/lib/igra";

// Link izazova: zapamti tko izaziva i pošalji igrača na početnu.
export async function GET(req: NextRequest, ctx: { params: Promise<{ kod: string }> }) {
  const { kod } = await ctx.params;
  const res = NextResponse.redirect(new URL("/", req.url), 303);
  if (KOD.test(kod)) {
    res.cookies.set(KOLACIC_IZAZOV, kod, {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24,
    });
  }
  return res;
}
