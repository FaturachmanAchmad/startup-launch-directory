import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = schema.parse(body);

    // OPT: Before — findUnique + create = 2 DB round-trips + a race condition
    //      (two concurrent requests can both pass the findUnique check).
    //
    // After — createMany with skipDuplicates = 1 round-trip, atomic at DB level.
    // The unique constraint on email guarantees correctness with no extra query.

    const result = await prisma.newsletterSubscriber.createMany({
      data: [{ email }],
      skipDuplicates: true,
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Already subscribed!" }, { status: 400 });
    }

    return NextResponse.json({ message: "Subscribed successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}