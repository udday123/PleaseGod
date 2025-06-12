// app/api/orders/route.ts
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route"; // Adjust path if needed
import prisma from "../../db/lib/singleton";
import { Trade } from "@prisma/client";

export async function GET(request: Request) {
  try {
    // 1. Get the session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");

    console.log('Fetching orders with params:', { status, userId });

    // 3. Build query
    const query: any = {
      where: {
        userId: session.user.id,
      },
      orderBy: {
        timestamp: "desc",
      },
    };

    // Add status filter if provided
    if (status) {
      query.where.status = status;
    }

    // 4. Fetch Orders from Database using Prisma
    const orders = await prisma.trade.findMany(query);
    console.log('Found orders:', orders.length);

    // 5. Format the response
    const formattedOrders = orders.map((order: Trade) => ({
      orderId: order.orderId,
      market: order.market,
      orderType: order.orderType,
      price: Number(order.price),
      quantity: Number(order.quantity),
      filledQuantity: Number(order.filledQuantity),
      unfilledQuantity: Number(order.unfilledQuantity),
      averagePrice: Number(order.averagePrice),
      status: order.status,
      timestamp: order.timestamp,
      postOnly: order.postOnly,
      ioc: order.ioc,
      side: order.side,
    }));

    console.log('Returning formatted orders:', formattedOrders.length);
    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}