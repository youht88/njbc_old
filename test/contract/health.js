assets:
{"title":"健康合约1.1.5"
}
//通用合约封装
version("1.1.5")
contract = new Contract()
class Cta{
  constructor(appName){
    this.appName = appName
    this.args = null
  }
  init(args){
    if (this.args) throw new Error("合约已经被初始化!")
    this.args = args
  }
  onlyInit(){
    if (!this.args) throw new Error("合约还没有被初始化!")
  }
  onlyOwner(caller){
    if (caller != contract.owner) throw new Error(`[${caller}]必须是创建者[${contract.owner}]才能调用该函数!`)
  }
  sayHello(msg){
     this.onlyInit()
     return `hello ${msg},this is app {${this.appName}}!!!!!`
  }
  async set (data,caller,amount,crypt=false){
     this.onlyInit()
     return contract.set(data,caller,amount,crypt)
  }
  async get(key=null,inAddr=null,list=false){
     this.onlyInit()
     return contract.get(key,inAddr,list)
  }
  async getBalance(address){
      return contract.getBalance(address)
  }
  async getBalancePaid(address){
     return contract.getBalancePaid(address)
  }
  async payTo(address,amount,assets){
    return contract.payTo(address,amount,assets)
  }
  async getAccount(address){
    return contract.getAccount(address)
  }
  getStock(code,start,end){
    if (!end) end=start
    let url =`http://q.stock.sohu.com/hisHq?code=cn_${code}&start=${start}&end=${end}`
    return ajax(url).then(x=>{
      let res = JSON.parse(x)   
      if (Array.isArray(res)){
        if (res[0].status==0)
           return res[0].hq
        return res
      }
      return res
    })
  }
}
instance = new Cta("health")
return instance

//
//assets:
{"title":"健康合约149obCeuqpq3GiNpZyKwRH32mCGKH8B4Tr",
 "allowAddress":["149obCeuqpq3GiNpZyKwRH32mCGKH8B4Tr"]
}

version("0.1.2")
cta = getInstance('c9047454af78fbd7fca58afad4507c1c34a07534')
cta.init({id:'149obCeuqpq3GiNpZyKwRH32mCGKH8B4Tr'})
return cta

//
cta = getInstance("a10377c37bc4ca41f7adf7df19cf2f8a0d7accf3")
return cta.get()
