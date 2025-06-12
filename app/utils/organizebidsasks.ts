export interface Entry {
    price: string;
    quantity: string;
    totalquantity: number;
  }
  
  export interface OrderbookData {
    prefixquantity_bids: Entry[];
    prefixquantity_asks: Entry[];
  }
  

export default function organize(bids:Entry[],asks:Entry[]):OrderbookData {

    asks.sort((a, b) => {
        return parseFloat(b.price) - parseFloat(a.price);
      });
      
      const prefixquantity_bids: Entry[] = [];
      const prefixquantity_asks: Entry[] = [];

      let totalBids = 0;
      for (let bid of bids) {
        const quantity = parseFloat(bid.quantity);
        totalBids += quantity;
        prefixquantity_bids.push({
          price: bid.price,
          quantity: bid.quantity,
          totalquantity: parseFloat(totalBids.toFixed(6))
        });
      }
    
      let totalAsks = 0;
      for (let ask of asks) {
        const quantity = parseFloat(ask.quantity);
        totalAsks += quantity;
        prefixquantity_asks.push({
          price: ask.price,
          quantity: ask.quantity,
          totalquantity: parseFloat(totalAsks.toFixed(6))
        });
      }
    
      return { prefixquantity_bids, prefixquantity_asks };
    }