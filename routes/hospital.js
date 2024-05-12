import express from "express"
import db from "./../utils/mysql2-connect.js"

const router = express.Router();

const getListData = async (req) => {
  // SELECT * FROM `address_book` WHERE `name` LIKE '%詩涵%'
  let keyword = req.query.keyword || "";

  let redirect = ""; // 作為轉換依據的變數
  const perPage = 8; // 每頁最多幾筆
  const sql = `SELECT COUNT(1) totalRows FROM hospital`;
  let page = +req.query.page || 1;
  if (page < 1) {
    redirect = "?page=1";
    return { success: false, redirect };
  }

  // 多層的展開, totalRows 總筆數
  const [[{ totalRows }]] = await db.query(sql);
  const totalPages = Math.ceil(totalRows / perPage); // 總頁數

  let rows = [];
  if (totalRows > 0) {
    if (page > totalPages) {
      redirect = `?page=${totalPages}`;
      return { success: false, redirect };
    }
    const sql2 = `SELECT * FROM \`hospital\` ORDER BY hospital_id  DESC LIMIT ${
      (page - 1) * perPage
    }, ${perPage}`;
    [rows] = await db.query(sql2);
  }

  return {
    success: true,
    totalRows,
    perPage,
    totalPages,
    rows,
    page,
    keyword,
    qs: req.query,
  };
};
// 
// router.get("/",async(req,res)=>{

// })

router.get("/api",async (req,res)=>{
  const data = await getListData(req);
  res.json(data);
});

export default router;

