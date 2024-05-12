import express from "express"
import db from "./../utils/mysql2-connect.js"

const router = express.Router();

router.post("/responses",(req,res)=>{
const { questionNumber, answer } = req.body;
const sql=`SELECT * FROM`
})