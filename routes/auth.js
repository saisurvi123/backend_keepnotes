const express=require('express');
const router=express.Router();
const User = require("../models/User");
const otpverify = require("../models/otp");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer=require('nodemailer')
const { body, validationResult } = require("express-validator");
const fetchuser=require('../middleware/fetchuser')
const moment=require('moment')
router.get('/',(req,res)=>{
    res.json({
        a:"sai",
        b:"kiran"
    })
})
// tool functions for  mailing 

let transporter=nodemailer.createTransport({
  host:"smtp.gmail.com",
  secure:false,
  auth:{
    user:"survisaikiran79@gmail.com",
    pass:"cldtfvgetdeokheq"

  },
})
// testing success
transporter.verify((err,success)=>{
  if(err){
    // console.log("failed to connect transmitter")
    console.log(err);
  }
  else{
    console.log("ready for messages")
  }
})

// for creating users 

router.post(
    "/createUser",
    [body("email").isEmail(),
    body("password").isLength({ min: 6 }, body("name").isLength({ min: 5 }))],
    (req, res) => {
      console.log(req.body);
      // validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // lets check for duplicates
      else{
          // creation of user
          User.findOne({"email":req.body.email}, (err, results) => {
              if (err) return handleError(err);
              if (results) {
                return res.send({ error: "enetered email is already in use" });
              } else {
                
                const salt = bcrypt.genSaltSync(10);
                const secPass= bcrypt.hashSync(req.body.password,salt);
                const user1 = new User({
                  name: req.body.name,
                  email: req.body.email,
                  password: secPass,
                });
                var token = jwt.sign({id:user1.id}, 'shskdfjaoeruwo');
                // console.log(token);
                user1.save().then((result)=>{
                  
                  result.token=token;
                  // console.log(result);
                  sendotp(result,res); 
                })
                // res.send({ success: "User created successfully",authtoken:token });
                // res.end();
              }
            });
          }
      }
      
  );

// logging users

  router.post("/loginUser",[body("email").isEmail(),
  body("password").exists()],(req,res)=>{
      console.log(req.body);
      // validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      else{
          // creation of user
          User.findOne({"email":req.body.email}, (err, results) => {
              if (err) return handleError(err);
              if (!results){
                return res.send({ error: "pls enter valid credentials" });
              } else {
               
               const passcomp=bcrypt.compareSync(req.body.password,results.password);
               if(!passcomp){
                return res.send({ error: "pls enter valid credentials" });
               }
               else{
                  var token = jwt.sign({id:results.id}, 'shskdfjaoeruwo');
                  console.log(token);
                  res.send({authtoken:token});
               }
              }
            });
          }
      }
  )
  // getting details of users
  
  router.post("/getUser",fetchuser,(req,res)=>{
      console.log(req.user)
      // console.log(req.user);
      const userid=req.user.id;
      User.findById({_id:userid},(err,results)=>{
          if(results){
              console.log(results);
              res.send(results);
          }
          else{
              res.status(401).send({error:"pls authenticate properly"})
          }
      }).select("-password")
      
  })
  
 // sending otp to mails

const sendotp= async({_id,email,token},res)=>{
  const Otp=`${Math.floor(1000+Math.random()*9000)}`;
  console.log(token)
  const mailoptions={
    from:"survisaikiran79@gmail.com",
    to:email,
    subject:"verifying your email by saikiran for instagram",
     html:`<p> enter the <b>${Otp}</b> in web to verify your email address</p>
     <p>  OTP <b> expires</b> in 1 hour</p>`
  }
  const newotp=new otpverify({
    userId:_id,
    otp:Otp,
    createdAt:Date.now(),
    expiresAt:moment(Date.now()).add(30, 'm').toDate()
  });
  await newotp.save();
  await transporter.sendMail(mailoptions);
  
   res.send({
    authtoken:token,
    status:"pending",
    message:"verification otp mail sent",
    data:{
       userId:_id,
       email:email
    },
    success: "User created successfully"
   }
   )
  //  res.end();
}

// verifying otp based on entry
router.post('/verifyOTP',async(req,res)=>{
  try {
    let {userId,otp}=req.body;
    if(!userId || !otp){
       throw Error("empty otp details are not allowed")
    }
    else{
      console.log("here")
      const rec=await otpverify.find({
        userId,
      });
      if(rec.length<=0){
        return res.send({
          error:"acc records not found"
        })
      }
      else{
        const {expiresAt}=rec[0];
        const OTP=rec[0].otp;
        if(expiresAt<Date.now()){
          await otpverify.deleteMany({userId});
          return res.send({
            error:"time expired"
          })
        }
        else{
          if(otp===OTP){
            await User.updateOne({_id:userId},{verified:true});
            await otpverify.deleteMany({userId});
            res.json({
              status:"VERIFIED",
              message:"User email verified successfully"
            })
          }
          else{
            throw Error("incorrect otp");
          }
        }
      }
    }
  } catch (error) {
    console.log(error)
     res.send(error);
  }
})

module.exports=router