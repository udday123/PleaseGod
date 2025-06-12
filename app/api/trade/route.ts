// app/api/trade/route.ts

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../auth/authOptions";
import { getDepth } from "@/app/utils/httpClient";
import Decimal from "decimal.js"; // This imports the Decimal class/constructor
import { v4 as uuidv4 } from 'uuid';
import prisma from "../../db/lib/singleton"; // Import your Prisma client instance

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const {
      market,
      orderType,
      price: parsedPrice,
      quantity: parsedQuantity,
      postOnly,
      ioc,
      // priceType,
      tradeType,
    } = await req.json();

    // Validate required fields
    if (!market || !orderType || !parsedQuantity || !tradeType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const orderId = uuidv4();
    const timestamp = Date.now();

    let averagePrice = new Decimal(0);
    let filledQuantityDecimal = new Decimal(0);
    let unfilledQuantityDecimal = new Decimal(parsedQuantity);
    let message = "Order processing.";
    let status = "Open";

    // Process the order based on type
    if (orderType === "Limit" && ioc) {
      const orderBookSnapshot = await getDepth(market);
      if (!orderBookSnapshot) {
        return NextResponse.json(
          { error: "Order book unavailable" },
          { status: 500 }
        );
      }

      const bookSide = tradeType === "BUY" ? orderBookSnapshot.asks : orderBookSnapshot.bids;
      if (!bookSide) {
        return NextResponse.json(
          { error: "Order book side unavailable" },
          { status: 500 }
        );
      }

      let currentRemainingQty = new Decimal(parsedQuantity);
      let totalValue = new Decimal(0);
      let totalFilledQty = new Decimal(0);

      for (const [priceStr, qtyStr] of bookSide) {
        if (currentRemainingQty.isZero()) break;

        const price = new Decimal(priceStr);
        const qty = new Decimal(qtyStr);

        // Check price conditions
        if (tradeType === "BUY" && price.greaterThan(parsedPrice)) break;
        if (tradeType === "SELL" && price.lessThan(parsedPrice)) break;

        const tradeQty = Decimal.min(qty, currentRemainingQty);
        totalValue = totalValue.plus(price.times(tradeQty));
        totalFilledQty = totalFilledQty.plus(tradeQty);
        currentRemainingQty = currentRemainingQty.minus(tradeQty);
      }

      filledQuantityDecimal = totalFilledQty;
      unfilledQuantityDecimal = currentRemainingQty;

      if (totalFilledQty.greaterThan(0)) {
        averagePrice = totalValue.dividedBy(totalFilledQty);
        status = currentRemainingQty.isZero() ? "Filled" : "Partially Filled";
        message = `IOC ${tradeType} order ${status.toLowerCase()}.`;
      } else {
        status = "Canceled";
        message = `IOC ${tradeType} order could not be filled and was canceled.`;
      }
    } else if (orderType === "Market") {
      const orderBookSnapshot = await getDepth(market);
      if (!orderBookSnapshot) {
        return NextResponse.json(
          { error: "Order book unavailable" },
          { status: 500 }
        );
      }

      const bookSide = tradeType === "BUY" ? orderBookSnapshot.asks : orderBookSnapshot.bids;
      if (!bookSide) {
        return NextResponse.json(
          { error: "Order book side unavailable" },
          { status: 500 }
        );
      }

      let currentRemainingQty = new Decimal(parsedQuantity);
      let totalValue = new Decimal(0);
      let totalFilledQty = new Decimal(0);

      for (const [priceStr, qtyStr] of bookSide) {
        if (currentRemainingQty.isZero()) break;

        const price = new Decimal(priceStr);
        const qty = new Decimal(qtyStr);
        const tradeQty = Decimal.min(qty, currentRemainingQty);

        totalValue = totalValue.plus(price.times(tradeQty));
        totalFilledQty = totalFilledQty.plus(tradeQty);
        currentRemainingQty = currentRemainingQty.minus(tradeQty);
      }

      filledQuantityDecimal = totalFilledQty;
      unfilledQuantityDecimal = currentRemainingQty;

      if (totalFilledQty.greaterThan(0)) {
        averagePrice = totalValue.dividedBy(totalFilledQty);
        status = currentRemainingQty.isZero() ? "Filled" : "Partially Filled";
        message = "Market order executed.";
      } else {
        status = "Canceled";
        message = "Market order canceled due to insufficient liquidity.";
      }
    }

    // Save the trade if there was any fill
    if (filledQuantityDecimal.greaterThan(0)) {
      // Start a transaction to update trade, balance, and portfolio
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create the trade record
        const trade = await tx.trade.create({
          data: {
            orderId: orderId,
            userId: userId,
            market: market,
            orderType: orderType,
            price: parsedPrice,
            quantity: parsedQuantity,
            filledQuantity: filledQuantityDecimal.toNumber(),
            unfilledQuantity: unfilledQuantityDecimal.toNumber(),
            averagePrice: averagePrice.toNumber(),
            status: status,
            timestamp: new Date(timestamp),
            postOnly: postOnly || false,
            ioc: ioc || false,
            side: tradeType
          },
        });

        // 2. Update or create user's balance
        const baseAsset = market.split('_')[0]; // e.g., "BTC" from "BTC_USDC"
        const quoteAsset = market.split('_')[1]; // e.g., "USDC" from "BTC_USDC"
        
        // Calculate the total cost/value of the trade
        const totalValue = filledQuantityDecimal.times(averagePrice);
        
        if (tradeType === "BUY") {
          // For buy orders:
          // - Decrease USDC balance (quote asset)
          // - Increase asset balance (base asset)
          const quoteBalance = await tx.balance.findFirst({
            where: {
              userId: userId,
              asset: quoteAsset
            }
          });

          if (quoteBalance) {
            await tx.balance.update({
              where: { id: quoteBalance.id },
              data: {
                available: {
                  decrement: totalValue.toNumber()
                }
              }
            });
          } else {
            await tx.balance.create({
              data: {
                userId: userId,
                asset: quoteAsset,
                available: -totalValue.toNumber(),
                locked: 0
              }
            });
          }

          const baseBalance = await tx.balance.findFirst({
            where: {
              userId: userId,
              asset: baseAsset
            }
          });

          if (baseBalance) {
            await tx.balance.update({
              where: { id: baseBalance.id },
              data: {
                available: {
                  increment: filledQuantityDecimal.toNumber()
                }
              }
            });
          } else {
            await tx.balance.create({
              data: {
                userId: userId,
                asset: baseAsset,
                available: filledQuantityDecimal.toNumber(),
                locked: 0
              }
            });
          }
        } else {
          // For sell orders:
          // - Increase USDC balance (quote asset)
          // - Decrease asset balance (base asset)
          const quoteBalance = await tx.balance.findFirst({
            where: {
              userId: userId,
              asset: quoteAsset
            }
          });

          if (quoteBalance) {
            await tx.balance.update({
              where: { id: quoteBalance.id },
              data: {
                available: {
                  increment: totalValue.toNumber()
                }
              }
            });
          } else {
            await tx.balance.create({
              data: {
                userId: userId,
                asset: quoteAsset,
                available: totalValue.toNumber(),
                locked: 0
              }
            });
          }

          const baseBalance = await tx.balance.findFirst({
            where: {
              userId: userId,
              asset: baseAsset
            }
          });

          if (baseBalance) {
            await tx.balance.update({
              where: { id: baseBalance.id },
              data: {
                available: {
                  decrement: filledQuantityDecimal.toNumber()
                }
              }
            });
          } else {
            await tx.balance.create({
              data: {
                userId: userId,
                asset: baseAsset,
                available: -filledQuantityDecimal.toNumber(),
                locked: 0
              }
            });
          }
        }

        // 3. Update or create portfolio entry
        const existingPortfolio = await tx.portfolio.findFirst({
          where: {
            userId: userId,
            market: market
          }
        });

        if (existingPortfolio) {
          // Update existing portfolio
          const newQuantity = tradeType === "BUY" 
            ? Number(existingPortfolio.quantity) + filledQuantityDecimal.toNumber()
            : Number(existingPortfolio.quantity) - filledQuantityDecimal.toNumber();

          if (newQuantity > 0) {
            // Calculate new average entry price
            const totalCost = tradeType === "BUY"
              ? (Number(existingPortfolio.avgEntry) * Number(existingPortfolio.quantity)) + (averagePrice.toNumber() * filledQuantityDecimal.toNumber())
              : (Number(existingPortfolio.avgEntry) * Number(existingPortfolio.quantity)) - (averagePrice.toNumber() * filledQuantityDecimal.toNumber());

            await tx.portfolio.update({
              where: { id: existingPortfolio.id },
              data: {
                quantity: newQuantity,
                avgEntry: totalCost / newQuantity
              }
            });
          } else {
            // Remove portfolio entry if quantity becomes 0
            await tx.portfolio.delete({
              where: { id: existingPortfolio.id }
            });
          }
        } else if (tradeType === "BUY") {
          // Create new portfolio entry for buy orders
          await tx.portfolio.create({
            data: {
              userId: userId,
              market: market,
              quantity: filledQuantityDecimal.toNumber(),
              avgEntry: averagePrice.toNumber()
            }
          });
        }

        return trade;
      });

      message += " Trade saved to history and portfolio updated.";
    } else {
      message += " No fill, trade not saved to history.";
    }

    return NextResponse.json({
      order: {
        id: orderId,
        market: market,
        orderType: orderType,
        side: tradeType,
        price: parsedPrice,
        quantity: parsedQuantity,
        filledQuantity: filledQuantityDecimal.toNumber(),
        unfilledQuantity: unfilledQuantityDecimal.toNumber(),
        averagePrice: averagePrice.toNumber(),
        status: status,
        timestamp: timestamp,
        postOnly: postOnly || false,
        ioc: ioc || false,
      },
      message: message,
    });
  } catch (error) {
    console.error("Error processing trade:", error);
    return NextResponse.json(
      { error: "Failed to process trade", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}