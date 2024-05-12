import dotenv from "dotenv";

dotenv.config({
    path: "./dev.env", // 工作目錄的相對位置
});

console.log(process.env.DB_NAME);