import { BigDecimal } from "@graphprotocol/graph-ts"
import {constants} from '../../graphprotocol-utils'

import { 
  transfer,
  transaction, 
  collection
} from "../../generated/schema"


export function MatchTransferWithSale(
  TransferId: string,
  transferAmount: BigDecimal,
  TransactionId: string,
  SaleId: string,
  ): void {
    
     if (TransferId && transferAmount && TransactionId && SaleId) {
       
      // Load the indexed transfer.
      let transferEntity = transfer.load(TransferId)
      if (transferEntity && transferEntity.amount == constants.BIGDECIMAL_ZERO ){
        let transactionEntity = transaction.load(TransactionId)
        if (transactionEntity) {
        
          // Update transfer values
          transferEntity.amount = transferAmount 
          transferEntity.matchedSale = SaleId
          
          // Decrease unmatched transfer count by one (in case of batch sales in single transaction)
          transactionEntity.unmatchedTransferCount = transactionEntity.unmatchedTransferCount - 1
          
          transferEntity.save()
          transactionEntity.save()

          

            // Update collection metrics
            let collectionEntity = collection.load(transferEntity.collection)
            if (collectionEntity) {
              collectionEntity.totalSales = collectionEntity.totalSales + 1
              collectionEntity.totalVolume = collectionEntity.totalVolume.plus(transferAmount)

              if (transferAmount > collectionEntity.topSale) {
                collectionEntity.topSale = transferAmount
              }

              collectionEntity.save()
            }

           
          
        }
      }
    }
  }
  