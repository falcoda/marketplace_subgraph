import { MarketItem} from '../generated/schema'
import { CreateMarketItem ,CreateMarketSale,CancelMarketItem} from "../generated/SageMarket/SageMarket";
import { addTransaction } from "./transactions";

import {TypedMap, Entity,Value,ValueKind,store,Address, Bytes,BigInt,BigDecimal } from "@graphprotocol/graph-ts";
import {
	sale,
	transaction,  
} from '../generated/schema'

import {
  MatchTransferWithSale
} from "./utils/matchTransferSale"


export function handleCreateMarketItem(event: CreateMarketItem): void {
  let marketItem = new MarketItem(event.params.itemId.toHex())
  marketItem.collection = event.params.nftContract.toHex();
  marketItem.tokenId = event.params.tokenId.toI32()
  marketItem.seller = event.params.seller
  marketItem.price = event.params.price
  marketItem.onSale = event.params.onSale
  marketItem.save() 
  addTransaction("CreateMarketItem", event,event.params.nftContract.toHex(),event.params.tokenId,event.params.price,"",event.params.seller.toHex());
}

export function handleCreateMarketSale(event: CreateMarketSale): void {
  
  //1. load transaction
  let tx = transaction.load(event.transaction.hash.toHexString())
  
  //2. nullcheck transaction entity (one should already exist for the transfer earlier in that) 
  if (tx ){

    //3. create new sale entity (id = tx hash - eventId)  
    let saleEntity = sale.load(event.block.number.toString() + '-' + event.logIndex.toString())
    if (!saleEntity && tx.unmatchedTransferCount > 0) {
  
        //4. Assign currency address, amount, txId and platform to sale entity
        let saleEntity = new sale(event.block.number.toString() + '-' + event.logIndex.toString())
        saleEntity.transaction   = tx.id
        saleEntity.amount        = event.params.price.divDecimal(BigDecimal.fromString('1')) 
        saleEntity.blockNumber   = event.block.number.toI32()
        saleEntity.timestamp     = event.block.timestamp.toI32()
        saleEntity.collection = event.params.nftContract.toHex();
        saleEntity.tokenId = event.params.tokenId.toI32()
        saleEntity.seller = event.params.seller
        saleEntity.buyer = event.params.buyer
        saleEntity.fee = event.params.fee
        saleEntity.save()
          
        //5. Assign sale.amount / transaction.unmatchedTransferCount to variable transferAmount to pass into transfer entities 
        // This will derives the amount per transfer (eg each nft's amount in a bundle with 2 NFT's is the total price divided by 2.)
        let transferAmount      = saleEntity.amount.div(BigDecimal.fromString(tx.unmatchedTransferCount.toString()))  
        
        //6. Using unmatchedTransferId loop through the transfer entities and apply the transferAmount and assign saleId , 
        //reducing the unmatchedTransferCount by 1. save transfer update on each loop.
        if(tx.transfers && transferAmount && tx.id && saleEntity.id) {
                  
          let array = tx.transfers
          for (let index = 0; index < array.length; index++) {

            let trId = array[index]            

            MatchTransferWithSale(
              trId, 
              transferAmount,
              tx.id,
              saleEntity.id,
            )
              
          }
        }
      
    }
  }

  let marketItem = new MarketItem(event.params.itemId.toHex())
  marketItem.onSale = false
  marketItem.save() 
  addTransaction("CreateMarketSale", event,event.params.nftContract.toHex(),event.params.tokenId,event.params.price,event.params.buyer.toHex(),event.params.seller.toHex());

}

export function handleCancelMarketItem(event: CancelMarketItem): void {
  

  let marketItem = new MarketItem(event.params.itemId.toHex())
  marketItem.collection = event.params.nftContract.toHex();
  marketItem.tokenId = event.params.tokenId.toI32()
  marketItem.seller = event.params.seller
  marketItem.price =new BigInt( 0)
  marketItem.onSale = false
  marketItem.save() 
  addTransaction("CancelMarketItem", event,event.params.nftContract.toHex(),event.params.tokenId,new BigInt(0),"",event.params.seller.toHex());

}






