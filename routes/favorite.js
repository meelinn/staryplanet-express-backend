import express from "express";
import db from "./../utils/mysql2-connect.js";

const router = express.Router();

router.get("/pet", async (req, res) => {
  try {
    let favorite = req.query.favorite;
    let member_id = req.query.member_id || 0;
    console.log(member_id);

    let where = " WHERE 1 ";
    if (member_id) {
      where += ` AND (
          \`fk_member_id\` = ${db.escape(`${member_id}`)}
      )`;
    } else {
      return res.json({ success: false, info: "缺少會員 ID" });
    }

    let redirect = ""; // 作為轉換依據的變數
    const perPage = 8; // 每頁最多幾筆
    const sql = `SELECT COUNT(1) totalRows FROM pet_like 
    JOIN members ON pet_like.fk_member_id=members.memberID 
    JOIN pet_info ON pet_like.fk_pet_id=pet_info.pet_id
    ${where}`;
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

      const sql2 = `SELECT * FROM pet_like 
      JOIN members ON pet_like.fk_member_id=members.memberID 
      JOIN pet_info ON pet_like.fk_pet_id=pet_info.pet_id ${where} ORDER BY pet_id DESC LIMIT ${
        (page - 1) * perPage
      }, ${perPage}`;

      [rows] = await db.query(sql2);
      console.log(sql2);
    }

    console.log(sql);

    return res.json({
      success: true,
      totalRows,
      perPage,
      totalPages,
      rows,
      page,
      qs: req.query,
    });
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.get("/product", async (req, res) => {
  try {
    let member_id = req.query.member_id || 0;

    let where = " WHERE 1 ";

    if (member_id) {
      where += ` AND (
        \`fk_member_id\` = ${db.escape(`${member_id}`)}
    )`;
    } else {
      return res.json({ success: false, info: "缺少會員 ID" });
    }

    let redirect = ""; // 作為轉換依據的變數
    const perPage = 8; // 每頁最多幾筆

    const sql = `SELECT COUNT(1) totalRows FROM product_likes 
  JOIN members ON product_likes.fk_member_id=members.memberID 
  JOIN products ON product_likes.fk_product_id=products.products_id
  ${where} ORDER BY product_like_id DESC`;

    console.log(sql);
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

      const sql2 = `SELECT * FROM product_likes 
  JOIN members ON product_likes.fk_member_id=members.memberID 
  JOIN products ON product_likes.fk_product_id=products.products_id ${where} ORDER BY product_like_id DESC LIMIT ${
        (page - 1) * perPage
      }, ${perPage}`;

      [rows] = await db.query(sql2);
      console.log(sql2);
    }

    console.log(sql);

    return res.json({
      success: true,
      totalRows,
      perPage,
      totalPages,
      rows,
      page,
      qs: "?favorite=product" + req.query,
    });
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

export default router;
