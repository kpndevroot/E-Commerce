const MongoClient = require('mongodb').MongoClient

const state={        ///defing state
    db:null
}

module.exports.connect=(done)=>{   //(done) is callback funtion
    const url="mongodb://localhost:27017"
    const dbname="shopping"

    MongoClient.connect(url,(err,data)=>{
        if(err)  return done(err)

        state.db=data.db(dbname)

        done()
    })

}

module.exports.get=()=>{return state.db}