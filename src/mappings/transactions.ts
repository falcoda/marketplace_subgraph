import { ethereum } from "@graphprotocol/graph-ts";

import { MarketTransaction } from "../generated/schema";
import { BigInt,Bytes} from "@graphprotocol/graph-ts";
export function addTransaction(name: string, event: ethereum.Event, collection: string,tokenId: BigInt,price: BigInt,buyer:string,seller:string): void {
  
  let transaction = new MarketTransaction(event.transaction.hash.toHex());
  transaction.event = name;
  transaction.block = event.block.number.toI32();
  if (buyer !=""){
    transaction.buyer = Bytes.fromHexString(buyer)
  }
  transaction.seller =  Bytes.fromHexString(seller);
  
  
  transaction.collection= collection;
  transaction.tokenId =tokenId.toString()
  transaction.price =  price;
  transaction.timestamp= event.block.timestamp.toI32();
  transaction.save();
}
