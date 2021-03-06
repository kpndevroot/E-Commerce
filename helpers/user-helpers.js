var db=require('../config/connection')
var collection = require('../config/collections')
const bcrypt=require('bcrypt')
var objectId = require('mongodb').ObjectID
const { use } = require('../routes/users')
const { reject } = require('bcrypt/promises')
const { ObjectId  } = require('mongodb')
const { response } = require('express')
const collections = require('../config/collections')


module.exports = {
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{

            userData.Password=await bcrypt.hash(userData.Password,10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                resolve(data.ops[0])
            })

        })
    
    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response ={}
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
            if(user){
                bcrypt.compare(userData.Password,user.Password).then((status)=>{
                    if(status){
                        console.log("login sucess")
                        response.user=user
                        response.status=true
                        resolve(response)
                    }
                    else{
                        console.log("login Error")
                        resolve({status:false})
                    }
                })
            }
            else{
                console.log('login failed')
                resolve({status:false})
            }
    })

},
addToCart:(proId,userId,)=>{
    let proObj={
        item:objectId(proId),
        quantity:1
    }
    return new Promise (async(resolve,reject)=>{
        let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
        if(userCart){
            let proExist=userCart.product.findIndex(producte=> producte.item==proId)
            console.log(proExist);
            if(proExist!=-1){
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({user:objectId(userId),'product.item':objectId(proId)},
               {
                   $inc: {'product.$.quantity':1}
               }
                ).then(()=>{
                    resolve()
                })
            }else{
            db.get().collection(collection.CART_COLLECTION)
            .updateOne({user:objectId(userId)},
            {
                $push:{product:proObj}
            }
        ).then((response)=>{
            resolve()

        })
        }}
        else{

            let cartObj={
                user:objectId(userId),
                product:[proObj]
            }
            db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                resolve()
            })
        }
    })
},
getCartProducts:(userId)=>{
return new Promise(async(resolve,reject)=>{
    let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([{ 
        $match:{user:objectId(userId)}
    },  
    {
        $unwind:'$product'
    },
    {
        $project:{
            item:'$product.item',
            quantity:'$product.quantity'
        }
    },
    {
        $lookup:{
            from:collection.PRODUCT_COLLECTIONS,
            localField:'item',
            foreignField:"_id",
            as:'product'
        }
    },
    {
        $project:{
            item:1,quantity:1,product:{$arrayElemAt:['$product',0]} //this prod
        }
    }
  
]).toArray()
resolve(cartItems)
})
},
getCartCount:(userId)=>{
    return new Promise (async(resolve,reject)=>{
        let count=0
        let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
        if(cart){
            count=cart.product.length
        }
        resolve(count)
    })
},
changeProductQuantity:(details)=>{
    details.count=parseInt(details.count)   
    details.quantity=parseInt(details.quantity)
    return new Promise((resolve,reject)=>{
        if(details.count==-1 && details.quantity==1){

            db.get().collection(collection.CART_COLLECTION)
            .updateOne({_id:objectId(details.cart)},
            {
                $pull:{product:{item:objectId(details.product)}}
            }
            ).then((response)=>{
                resolve({removeProduct:true})
            })
        }
        else{    
        db.get().collection(collection.CART_COLLECTION)
        .updateOne({_id:objectId(details.cart), 'product.item':objectId(details.product)},
       {
           $inc: {'product.$.quantity':details.count}
       }
        ).then((response)=>{
            resolve(true)
        }) 
    }
    })
},
getTotalAmount:(userId)=>{
    return new Promise(async(resolve,reject)=>{
    let total=await db.get().collection(collection.CART_COLLECTION).aggregate([{ 
        $match:{user:objectId(userId)}
    },  
    {
        $unwind:'$product'
    },
    {
        $project:{
            item:'$product.item',
            quantity:'$product.quantity'
        }
    },
    {
        $lookup:{
            from:collection.PRODUCT_COLLECTIONS,
            localField:'item',
            foreignField:"_id",
            as:'product'
        }
    },
    {
        $project:{
            item:1,quantity:1,product:{$arrayElemAt:['$product',0]} //this prod
        }
    },
    {
    $group:{
        _id:null,
        total:{$sum:{$multiply:['$quantity','$product.price']}}
    }
}
  
]).toArray()

console.log("totalprice is= " + total[0].total);
resolve(total)
})
}

}