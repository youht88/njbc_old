
const fs=require('fs')
const async = require("async")
const utils = require("./utils.js")
const logger = utils.logger.getLogger()

const Transaction = require('./transaction.js').Transaction

class Block{
  constructor(args){
    this.index     = parseInt(args.index) || 0
    this.nonce     = parseInt(args.nonce) || 0
    this.prevHash  = args.prevHash ||""
    this.timestamp = parseInt(args.timestamp)
    this.diffcult  = parseInt(args.diffcult)
    this.merkleRoot= args.merkleRoot || ""
    this.data      = []
    for (var i=0 ;i < args.data.length;i++){
      this.data.push(Transaction.parseTransaction(args.data[i]))
    }
    this.hash     = args.hash     || this.updateHash()
  }  
  headerString(){
    return [this.index.toString(),
        this.prevHash,
        this.getMerkleRoot(),
        this.timestamp.toString(),
        this.diffcult.toString(),
        this.nonce.toString()].join("")
  }
  preHeaderString(){
    return [this.index.toString(),
        this.prevHash,
        this.getMerkleRoot(),
        this.timestamp.toString(),
        this.diffcult.toString()].join("")
  }
  getMerkleRoot(){
    let txHash=[]
    for (let item of this.data){
      txHash.push(item.hash)
    }
    this.merkleRoot=utils.hashlib.sha256(txHash.join(""))
    //merkleTree = merkle.Tree()
    //merkleRoot = merkleTree.makeTree(txHash)
    //self.merkleRoot = merkleRoot.value
    return this.merkleRoot

  }
  updateHash(preHeaderStr=null){
    if (preHeaderStr)
      this.hash = utils.hashlib.sha256(preHeaderStr+this.nonce.toString())
    else
      this.hash = utils.hashlib.sha256(this.headerString())
    return this.hash
  }
  dumps(){
    return {
      "index"      :this.index,
      "hash"       :this.hash,
      "prevHash"   :this.prevHash,
      "diffcult"   :this.diffcult,
      "nonce"      :this.nonce,
      "timestamp"  :this.timestamp,
      "merkleRoot" :this.merkleRoot,
      "data"       :this.data
    }
  }
  async save(){
    global.db.updateOne("blockchain",{"index":this.index},{"$set":this.dumps()},{"upsert":true})
    .catch(e=>console.log("save error:",e))
  }
  async saveToPool(){
    return new Promise(async (resolve,reject)=>{
      const {index,nonce} = this
      logger.warn(`save block ${index}-${nonce} to pool`)
      await global.db.updateOne("blockpool",{"hash":this.hash},{"$set":this.dumps()},{"upsert":true})
        .then(()=>resolve())
        .catch(e=>{console.log("saveToPool error:",e)
                   reject(e)   
              })
    })      
  }
  async removeFromPool(){
    global.db.deleteOne("blockpool",{"hash":this.hash})
    .catch(e=>console.log("removeFromPool error",e))
  }
  isValid(){
    if (this.index == 0 ) return true
    logger.debug(`verify block #${this.index}-${this.nonce}`)
    if (this.index >= global.diffcultIndex && this.index < parseInt(global.diffcultIndex) + parseInt(global.ADJUST_DIFFCULT) - 1 && this.diffcult < global.diffcult) {
      console.log(this.index,global.diffcultIndex,parseInt(global.diffcultIndex) + parseInt(global.ADJUST_DIFFCULT) - 1)
      logger.error(`${this.hash} is not worked because of diffcult is ${this.diffcult} but little then ${global.diffcult}`)
      return false
    }
    //logger.debug("verify proof of work")
    this.updateHash()

    let length = Math.floor(this.diffcult / 4 )
    let mod = this.diffcult % 4
         
    if ( parseInt(this.hash.slice(0,length+1),16) >= 2**(4-mod) ){
      logger.error(`${this.hash} is not worked because of WOF is not valid`)
      return false
    }
    
    //logger.debug(`${this.hash} is truly worked`)
    logger.debug("verify transaction data")
    let txAmount=[]
    for (let transaction of this.data){
      console.log("transaction hash:",transaction.hash)
      if (!transaction.isValid(txAmount)) {
        logger.error(`${this.hash} is not worked because of transaction is not valid`)
        return false
      }
    }
    //校验coinbase的交易费是否合法
    let fee=0
    if (txAmount.length>0)
      fee = txAmount.map(x=>x.txInAmount - x.txOutAmount).reduce((x,y)=>x+y)
    if (this.data[0].outs[1] && this.data[0].outs[1].amount > fee){
      logger.error('矿工交易费设置不合法',this.data[0].outs[1].amount,fee)
      return false
    }
    return true
  }
}
exports.Block = Block