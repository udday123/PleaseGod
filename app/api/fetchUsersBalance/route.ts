import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from "../../db/lib/singleton";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('Fetching balance for user:', session.user.id);

    const balance = await prisma.balance.findFirst({
      where: {
        userId: session.user.id,
        asset: 'USD'  // Assuming USD is the base currency
      }
    });

    console.log('Found balance:', balance);

    if (!balance) {
      // If no balance record exists, create one with 0 balance
      const newBalance = await prisma.balance.create({
        data: {
          userId: session.user.id,
          asset: 'USD',
          available: 0,
          locked: 0
        }
      });
      console.log('Created new balance record:', newBalance);
      return NextResponse.json({ balance: 0 });
    }

    return NextResponse.json({ 
      balance: Number(balance.available),
      locked: Number(balance.locked)
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    return NextResponse.json(
      { error: "Failed to fetch balance", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
