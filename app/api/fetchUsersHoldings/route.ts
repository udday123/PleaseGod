import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/authOptions';
import prisma from '../../db/lib/singleton';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const asset = searchParams.get('asset');

    if (!asset) {
      return NextResponse.json({ error: 'Asset parameter is required' }, { status: 400 });
    }

    const holding = await prisma.balance.findFirst({
      where: {
        user: { email: session.user.email },
        asset: asset.toUpperCase(),
      },
      select: { available: true },
    });

    if (!holding) {
      return NextResponse.json({
        holding: null,
        message: `No holdings found for ${asset}`,
      });
    }

    return NextResponse.json({ holding });

  } catch (error: unknown) {
    console.error('Error fetching user holding:', error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Internal server error', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: 'Unknown error occurred' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { market } = body;

    if (process.env.NODE_ENV !== 'production') {
      console.log('Fetching holdings for user:', session.user.id, 'market:', market);
    }

    const isFilteredMarket = market && market !== 'all';

    const portfolios = await prisma.portfolio.findMany({
      where: {
        userId: session.user.id,
        ...(isFilteredMarket ? { market } : {}),
      },
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log('Found portfolios:', portfolios);
    }

    const holdingsMap = new Map<string, { totalQuantity: number; totalValue: number }>();

    portfolios.forEach((portfolio) => {
      const existing = holdingsMap.get(portfolio.market) || {
        totalQuantity: 0,
        totalValue: 0,
      };

      existing.totalQuantity += Number(portfolio.quantity);
      existing.totalValue += Number(portfolio.quantity) * Number(portfolio.avgEntry);

      holdingsMap.set(portfolio.market, existing);
    });

    const holdings = Array.from(holdingsMap.entries()).map(([market, data]) => ({
      market,
      quantity: data.totalQuantity,
      averagePrice: data.totalQuantity > 0 ? data.totalValue / data.totalQuantity : 0,
    }));

    return NextResponse.json({
      holdings,
      totalQuantity: isFilteredMarket
        ? holdings.find((h) => h.market === market)?.quantity || 0
        : holdings.reduce((sum, h) => sum + h.quantity, 0),
    });

  } catch (error: unknown) {
    console.error('Error fetching holdings:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Failed to fetch holdings', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
