const mongoose=require('mongoose');
const mongoURI="mongodb+srv://keepnotesSai:saikiran@cluster0.zvqdsko.mongodb.net/?retryWrites=true&w=majority";
// this is how we connect to mongo
const connectToMongo=()=>{
    mongoose.connect(mongoURI,()=>{
        console.log("connected to database");
    })
}

module.exports= connectToMongo;