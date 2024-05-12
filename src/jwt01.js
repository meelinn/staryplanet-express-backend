import jwt from "jsonwebtoken";

const key = "wjfkj234jakljkl12";

const token = jwt.sign({name:"peter", id:17}, key);

console.log({token});