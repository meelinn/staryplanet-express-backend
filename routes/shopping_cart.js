// import express from "express";
// import db from "./../utils/mysql2-connect.js";
// // 使用 Express 框架的 Router 方法創建一個新的 router 實例。
// const router = express.Router();
// // 使用 router 物件的 get 方法來定義對於某個路徑的 GET 請求的處理方式。
// // ":id" 是一個路由參數，其值將在請求時被動態替換。
// router.get("/:id", async (req, res) => {
//   try {
//     // 從請求的 URL 路徑中取得 "id" 參數的值。
//     const id = req.params.id;
//     // 準備 SQL 查詢語句。這是一個字符串，其使用了 ES6 的模板字符串語法。
//     // SUBSTRING_INDEX 是 SQL 函數，用於截取字符串到第一個逗號為止，通常用於處理用逗號分隔的列表。
//     // "c" 和 "p" 是表別名(alias)，用於簡化查詢中對表名的引用。
//     // INNER JOIN 是 SQL 語法，用於聯合兩個表中相關的資料行。
//     const sql = `SELECT *,SUBSTRING_INDEX(p.product_picture,',',1) as porduct_img FROM shopping_cart c
//   INNER JOIN products p on p.products_id = c.fk_product_id
//   WHERE c.fk_member_id = ${id}`;

//     // 使用 await 關鍵字等待非同步的 db.query 方法執行完畢。
//     // db.query 方法是用來執行 SQL 語句並與資料庫進行互動。
//     // 結果被解構賦值給 data 變量。
//     const [data] = await db.query(sql);
//     // 使用 res.json 方法將查詢到的數據以 JSON 格式發送給客戶端。
//     res.json(data);
//   } catch (error) {
//     // 如果在嘗試過程中捕獲到任何錯誤，則將錯誤訊息記錄在控制台上。
//     console.log(error);
//   }
// });

// // router 是一個固定的 Express 框架概念，用於定義路由處理器。
// // get 是一種 HTTP 方法，表示這個路由處理器只會響應 GET 請求。
// // "/:id" 中的 : 表示 id 是一個參數，將被傳入的實際值替換。
// // async 和 await 是 JavaScript 的固定語法，用於處理非同步操作。
// // try...catch 是處理異常的標準 JavaScript 結構，用於捕獲並處理錯誤。
// // res.json(data) 是 Express 框架提供的方法，用於將響應內容格式化為 JSON。
// // console.log(error) 是 JavaScript 中用於輸出信息到控制台的標準函數。

// router.post("/", async (req, res) => {
//   // 處理 POST 請求的路由。這個路由用於更新購物車中某個項目的數量。
//   try {
//     // 從請求的 body 中解構出 cartid 和 count。這通常由前端發送的 JSON 物件中獲取。
//     const cartid = req.body.data.id;
//     const count = req.body.data.count;

//     // 初始化一個變量 number，根據 count 的值來決定是增加還是減少數量。
//     let number = 0;
//     if (count == "sub") {
//       number = -1; // 如果 count 為 "sub"，則表示要減少數量。
//     } else if (count == "add") {
//       number = 1; // 如果 count 為 "add"，則表示要增加數量。
//     }

//     // 構建 SQL 更新語句，以變更購物車中特定項目的數量。
//     const sql = `UPDATE shopping_cart SET cart_item_quantity = cart_item_quantity + ${number}
//     WHERE cart_item_id = ${cartid}`;

//     // 執行 SQL 語句，更新資料庫中的資料。
//     await db.query(sql);

//     // 發送一個 JSON 響應，通知客戶端更新操作成功。
//     res.json({ message: "ok" });
//   } catch (error) {
//     console.log(error);
//   }
// });

// router.delete("/:cartid", async (req, res) => {
//   try {
//     // 從 URL 路徑中獲取 cartid 參數。
//     const cid = req.params.cartid;

//     const sql = `DELETE FROM shopping_cart
//     WHERE cart_item_id = ${cid}`;
//     await db.query(sql);
//     res.json({ message: "ok" });
//   } catch (error) {
//     console.log(error);
//   }
// });

// export default router;

// /*router.post 和 router.delete 是 Express.js 框架中的方法，分別用於處理 POST 和 DELETE 類型的 HTTP 請求。
// /:cartid 是一個路由參數，會被請求 URL 中相應部分的實際值替換。
// try...catch 結構用於捕捉執行過程中的異常或錯誤。
// res.json 方法用於發送 JSON 格式的響應。
// console.log 用於在服務器的控制台上輸出錯誤訊息。*/
