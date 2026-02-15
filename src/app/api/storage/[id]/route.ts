import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!id) {
    return new NextResponse("Missing storage id", { status: 400 });
  }

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return new NextResponse("Convex URL is not configured", { status: 500 });
  }

  try {
    const client = new ConvexHttpClient(convexUrl);
    const signedUrl = await (client as unknown as {
      query: (path: string, args: { storageId: string }) => Promise<string | null>;
    }).query("products:getStorageUrl", {
      storageId: id,
    });

    if (!signedUrl) {
      return new NextResponse("Image not found", { status: 404 });
    }

    // Redirect browser to Convex signed URL.
    return NextResponse.redirect(signedUrl, { status: 307 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown image resolution error";
    return new NextResponse(`Failed to resolve image URL: ${message}`, {
      status: 500,
    });
  }
}
