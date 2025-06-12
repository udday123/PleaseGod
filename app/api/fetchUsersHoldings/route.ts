import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "../auth/[...nextauth]/route";
import prisma from '../../db/lib/singleton';
import { Portfolio } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the asset from query parameters
    const { searchParams } = new URL(req.url);
    const asset = searchParams.get('asset');

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset parameter is required' },
        { status: 400 }
      );
    }

    // Fetch user's holding for the specific asset
    const holding = await prisma.balance.findFirst({
      where: {
        user: {
          email: session.user.email
        },
        asset: asset.toUpperCase() 
      },
      select: {
        available: true,
      }
    });

    // If no holding found, return null
    if (!holding) {
      return NextResponse.json({ 
        holding: null,
        message: `No holdings found for ${asset}`
      });
    }

    // Return the holding
    return NextResponse.json({ holding });

  } catch (error: any) {
    console.error('Error fetching user holding:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { market } = body;

    console.log('Fetching holdings for user:', session.user.id, 'market:', market);

    // Fetch portfolio entries
    const portfolios = await prisma.portfolio.findMany({
      where: {
        userId: session.user.id,
        ...(market && market !== 'all' ? { market } : {})
      }
    });

    console.log('Found portfolios:', portfolios);

    // Calculate total quantity and average entry price for each market
    const holdingsMap = new Map();
    
    portfolios.forEach(portfolio => {
      const existing = holdingsMap.get(portfolio.market) || {
        totalQuantity: 0,
        totalValue: 0
      };
      
      existing.totalQuantity += Number(portfolio.quantity);
      existing.totalValue += Number(portfolio.quantity) * Number(portfolio.avgEntry);
      
      holdingsMap.set(portfolio.market, existing);
    });

    // Convert to array and calculate average entry prices
    const holdings = Array.from(holdingsMap.entries()).map(([market, data]) => ({
      market,
      quantity: data.totalQuantity,
      averagePrice: data.totalQuantity > 0 ? data.totalValue / data.totalQuantity : 0
    }));

    console.log('Processed holdings:', holdings);

    return NextResponse.json({
      holdings,
      totalQuantity: market && market !== 'all' 
        ? holdings.find(h => h.market === market)?.quantity || 0
        : holdings.reduce((sum, h) => sum + h.quantity, 0)
    });
  } catch (error) {
    console.error('Error fetching holdings:', error);
    return NextResponse.json(
      { error: "Failed to fetch holdings", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 