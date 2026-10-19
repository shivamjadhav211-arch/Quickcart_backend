const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 3000;
const usersFile = path.join(__dirname, "users.json");
const ordersFile = path.join(__dirname, "orders.json");
app.use(cors());
app.use(express.json());
function readJson(file){try{if(!fs.existsSync(file))fs.writeFileSync(file,"[]");return JSON.parse(fs.readFileSync(file,"utf8")||"[]")}catch(e){console.error("Read error:",file,e);return[]}}
function writeJson(file,data){fs.writeFileSync(file,JSON.stringify(data,null,2))}
app.get("/",(req,res)=>res.send("QuickCart Backend is Running!"));
app.get("/api/test",(req,res)=>res.json({success:true,message:"QuickCart API is working"}));
app.get("/api/orders",(req,res)=>res.json({success:true,orders:readJson(ordersFile)}));
app.post("/api/orders",(req,res)=>{try{const {customerName,mobile,address,items,paymentMethod="cod"}=req.body||{};if(!customerName||!/^[0-9]{10}$/.test(String(mobile||""))||!address||!Array.isArray(items)||items.length===0)return res.status(400).json({success:false,message:"Please provide valid customer details and at least one item."});const clean=items.map(i=>({name:String(i.name||""),price:Number(i.price),quantity:Number(i.quantity)}));if(clean.some(i=>!i.name||!Number.isFinite(i.price)||i.price<0||!Number.isInteger(i.quantity)||i.quantity<1))return res.status(400).json({success:false,message:"One or more cart items are invalid."});const order={orderId:"QC"+Date.now(),customerName:String(customerName).trim(),mobile:String(mobile),address:String(address).trim(),items:clean,total:clean.reduce((s,i)=>s+i.price*i.quantity,0),paymentMethod:["cod","upi","card"].includes(paymentMethod)?paymentMethod:"cod",status:"Placed",createdAt:new Date().toISOString()};const orders=readJson(ordersFile);orders.push(order);writeJson(ordersFile,orders);console.log("Order saved:",order.orderId);res.status(201).json({success:true,message:"Order placed successfully!",order})}catch(e){console.error(e);res.status(500).json({success:false,message:"Could not save order."})}});
app.post("/api/signup",async(req,res)=>{try{const {name,email,mobile,password}=req.body||{};if(!name||!email||!/^[0-9]{10}$/.test(String(mobile||""))||!password||String(password).length<6)return res.status(400).json({success:false,message:"Enter valid name, email, 10-digit mobile and password (6+ characters)."});const users=readJson(usersFile);if(users.some(u=>u.mobile===String(mobile)||u.email===String(email)))return res.status(409).json({success:false,message:"Account with this mobile or email already exists."});const hash=await bcrypt.hash(String(password),10);const user={name:String(name).trim(),email:String(email).trim(),mobile:String(mobile),password:hash};users.push(user);writeJson(usersFile,users);res.status(201).json({success:true,message:"Account created successfully."})}catch(e){console.error(e);res.status(500).json({success:false,message:"Signup failed."})}});
app.post("/api/login",async(req,res)=>{try{const {mobile,password}=req.body||{};const user=readJson(usersFile).find(u=>u.mobile===String(mobile||""));if(!user||!await bcrypt.compare(String(password||""),user.password||""))return res.status(401).json({success:false,message:"Invalid mobile number or password."});res.json({success:true,message:"Login successful.",user:{name:user.name,email:user.email,mobile:user.mobile}})}catch(e){console.error(e);res.status(500).json({success:false,message:"Login failed."})}});
app.listen(PORT,()=>console.log("================================\nQuickCart Backend is Running!\nhttp://localhost:"+PORT+"\n================================"));
