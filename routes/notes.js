const express = require("express");
const router = express.Router();
const Notes = require("../models/Notes");
const { body, validationResult } = require("express-validator");
const fetchuser = require("../middleware/fetchuser");
router.get("/", (req, res) => {
  res.json({
    a: "sai",
    b: "kiran",
  });
});
router.get("/fetchnotes", fetchuser, (req, res) => {
  const userid = req.user.id;
  Notes.find({ user: userid }, (err, result) => {
    if (err) return handleError(err);
    else {
      return res.send(result);
    }
  });
});
router.post(
  "/createnote",
  fetchuser,
  [
    body("title").isLength({ min: 3 }),
    body("description").isLength({ min: 5 }),
  ],
  (req, res) => {
    console.log(req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const userid = req.user.id;
    // lets check for duplicates
    Notes.findOne(
      {
        description: req.body.description,
      },
      (err, result) => {
        if (err) return handleError(err);
        if (result) {
          return res.status(400).send({ error: "already same list exists" });
        } else {
          const note1 = new Notes({
            user: userid,
            title: req.body.title,
            description: req.body.description,
            tag: req.body.tag,
          });
          note1.save();
          return res.send(note1);
        }
      }
    );
  }
);
router.put("/updatenote/:id",fetchuser,(req,res)=>{
  const {title,description,tag}=req.body;
  const newnote={};
  if(title){newnote.title=title};
  if(description){newnote.description=description};
  if(tag){newnote.tag=tag};
  //first check which user is updating the given notes id
  Notes.findById({_id:req.params.id},(err,result)=>{
    if (err) return handleError(err);
    if(result.user.toString()!==req.user.id){
      return res.status(401).send("permission rejected");
    }
    else{
        Notes.findByIdAndUpdate({_id:req.params.id},{$set:newnote},{new:true},(err,result)=>{
          if(err) return handleError(err);
          else{
            console.log("cool")
            return res.send(newnote);
          }
        })      
    }
  })
  

})
router.delete("/deletenote/:id",fetchuser,(req,res)=>{
 
  //first check which user is updating the given notes id
  Notes.findById({_id:req.params.id},(err,result)=>{
    if (err) return console.log(err);
    if(result.user.toString()!==req.user.id){
      return res.status(401).send("permission rejected");
    }
    else{
        Notes.findByIdAndDelete({_id:req.params.id},(err,result)=>{
          if(err) return handleError(err);
          else{
            console.log("cool")
            return res.send({Message:"deletion success"});
          }
        })      
    }
  })
  

})

module.exports = router;
