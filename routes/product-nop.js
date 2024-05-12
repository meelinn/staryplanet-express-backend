import express from "express"
import db from "../utils/mysql2-connect.js"

const router = express.Router();

const getNopListData = async (req) => {
  // SELECT * FROM `address_book` WHERE `name` LIKE '%詩涵%'
  let keyword = req.query.keyword || "";

  let redirect = ""; // 作為轉換依據的變數
  const perPage = 50; // 每頁最多幾筆


  const sql = `SELECT COUNT(1) totalRows FROM products`;
  
  let page = +req.query.page || 1;
  if (page < 1) {
    redirect = "?page=1";
    return { success: false, redirect };
  }

  // 多層的展開, totalRows 總筆數
  const [[{ totalRows }]] = await db.query(sql);
  const noptotalPages = Math.ceil(totalRows / perPage); // 總頁數

  //搜尋
  let where = " WHERE 1 ";
  if (keyword) {
    // 避免 SQL injection
    where += ` AND (
    product_name LIKE ${db.escape(`%${keyword}%`)} 
    )
    `;
  }

  let rows = [];


    const sql2 = `SELECT * FROM \`products\` ${where} AND product_nop > 1 ORDER BY products_id DESC LIMIT 5`;
    [rows] = await db.query(sql2);
  

  return {
    success: true,
    totalRows,
    perPage,
    noptotalPages,
    rows,
    page,
    keyword,
    qs: req.query,
  };
};

router.get("/api",async (req,res)=>{
  const data = await getNopListData(req);
  res.json(data);
});

export default router;