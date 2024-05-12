import express from "express"
import db from "../utils/mysql2-connect.js"

const router = express.Router();

const getListData = async (req) => {
  // SELECT * FROM `address_book` WHERE `name` LIKE '%詩涵%'
  let minPrice = req.query.minPrice || ""; // 新增最低價格參數
  let maxPrice = req.query.maxPrice || ""; // 新增最高價格參數
  let orderBy = req.query.orderBy || "product_id ASC"; // 預設排序方式為 product_id ASC
  let category = req.query.category || "";
  let keyword = req.query.keyword || "";
//req.query 包含了請求的查詢參數，這些參數通常是通過 GET 請求的 URL 中的查詢字符串傳遞的。這行代碼通過 req.query.keyword 獲取了名為 keyword 的參數值，如果查詢字符串中不存在這個參數，則將其值設置為空字符串。這樣做的目的是確保即使客戶端未提供 keyword 參數，代碼也能正常運行，而不會因為 keyword 變量未定義而導致錯誤。
let member_id = 0;  // 預設值為  0
// if(res.locals.jwt && res.locals.jwt.id) {
//   // 如果有 JWT 授權
//   member_id = res.locals.jwt.id;
// }


//子查詢:作為查詢喜愛表用 "變數let 常數是const"
let subQuery = `
(
  SELECT * FROM product_likes WHERE fk_member_id=${member_id}
) pl `;


console.log(category);

let where = "WHERE 1";
if(keyword) {
    // 避免 SQL injection 防止SQL注入攻擊是一種常見的安全漏洞
    where += ` AND (
      \`product_name\` LIKE ${db.escape(`%${keyword}%`)} 
      OR
      \`product_type\` LIKE ${db.escape(`%${keyword}%`)}
      OR
      \`product_class\` LIKE ${db.escape(`%${keyword}%`)}
      )
      `;
    }

  
      if (category) {
    
        where += ` AND (
          product_class = ${db.escape(`${category}`)} 
          OR
          product_type = ${db.escape(`${category}`)} 
          )
          `;
      }
    
    
    //if (category)：這個條件判斷確保 category 變數存在且有值。如果 category 是真值（不是 null、undefined、空字串等），就執行下面的程式碼。
//let categories = Array.isArray(category) ? category : [category]：這一行程式碼確保 category 變數是一個陣列，即使它只包含單個值。如果 category 已經是陣列，就保持不變；否則，將它轉換為一個包含單個元素的陣列。
//const categoryConditions = categories.map(cat => category_id = ${db.escape(cat)}).join(" OR ")：這一行程式碼將 categories 陣列中的每個元素轉換為一個 SQL 條件，然後使用 OR 鏈接這些條件。具體來說，map 函數將每個 cat 轉換為一個條件，這個條件表示 category_id 等於 cat。db.escape(cat) 用於對 cat 的值進行 SQL 轉義，以防止 SQL 注入攻擊。最後，join(" OR ") 將所有的條件用 OR 連接起來，形成一個完整的 SQL 條件字串。
//where += AND (${categoryConditions}) ：最後，這一行程式碼將上面生成的 SQL 條件字串添加到 where 變數中，並且用 AND 連接到原有的條件上。這樣就確保了查詢結果同時滿足原有的條件和 category 條件。


    if (minPrice) {
      where += ` AND (price >= ${db.escape(minPrice)}) `;
    }
  
    if (maxPrice) {
      where += ` AND (price <= ${db.escape(maxPrice)}) `;
    }

    // 根據前端傳遞的排序方式動態生成 ORDER BY 子句
  let orderByClause = "";
  switch (orderBy) {
    case "priceHigh":
      orderByClause = "product_price DESC";
      break;
    case "priceLow":
      orderByClause = "product_price ASC";
      break;
    default:
      orderByClause = "products_id ASC";
      break;
  }

  // let sorttype =req.query.sort;
  let redirect = ""; // 作為轉換依據的變數
  const perPage = 8; // 每頁最多幾筆
  const sql = `SELECT COUNT(1) totalRows FROM products ${where}`;
//準備了一個 SQL 查詢語句，用於獲取符合條件的記錄總數。${where} 是一個條件語句，用於過濾查詢結果。
  let page = +req.query.page || 1;
  //let page = +req.query.page || 1; - 從請求中獲取頁碼，並將其轉換為數字。如果未指定頁碼，則默認為第1頁。
  if (page < 1) {
    redirect = "?page=1";
    return { success: false, redirect };
  }
  //if (page < 1) { redirect = "?page=1"; return { success: false, redirect }; } - 如果頁碼小於1，表示頁碼無效，將 redirect 設置為第1頁的URL並返回失敗的結果，並將 redirect 作為重定向的路徑。
  console.log(category,sql);
  // 多層的展開, totalRows 總筆數
  const [[{ totalRows }]] = await db.query(sql);
   //這行程式碼執行了一個 SQL 查詢並從結果中獲取了總記錄數 totalRows。db.query(sql) 是一個異步操作，它返回一個包含結果的陣列。由於我們只對結果中的第一行感興趣，所以使用了解構賦值來獲取第一行的 totalRows 值。
  const totalPages = Math.ceil(totalRows / perPage); // 總頁數
   //總頁數
 //這行程式碼計算了總頁數 totalPages，通過將總記錄數除以每頁顯示的最大記錄數 perPage 來實現。Math.ceil 函數用於將除法結果向上取整，確保即使有餘數也能得到正確的總頁數。

//排序嘗試方法2
 const limitStart = (page - 1) * perPage;


//  console.log(selectSql)

  let rows = [];
   //let rows = [];：創建了一個空的陣列 rows 來存儲查詢結果。
  if (totalRows > 0) {
     //if (totalRows>0)：檢查總行數 totalRows 是否大於 0，這是為了確保查詢到了資料。
    if (page > totalPages) {
        //if(page>totalPages){：檢查當前的頁碼 page 是否大於總頁數 totalPages。如果是，表示當前頁碼超出了範圍，需要進行重定向。
      redirect = `?page=${totalPages}`;
        //redirect = ?page=${totalPages};：如果當前頁碼超出了範圍，將 redirect 變數設置為最後一頁的頁碼，以便後續進行重定向。
      return { success: false, redirect };
        //return {success: false,redirect};：返回一個包含 success 和 redirect 屬性的物件。success 設置為 false 表示查詢失敗，redirect 包含了需要進行重定向的 URL。
    }

    //搜尋功能+排序功能+我的最愛
    const sql2 =  `SELECT pr.*,pl.product_like_id 
    FROM products pr
    LEFT JOIN ${subQuery} ON pr.products_id = pl.fk_product_id ${where} ORDER BY ${orderByClause} LIMIT ${
  //計算出起始位置，即要跳過的資料行數，這是根據當前頁碼 page和每頁顯示的資料量 perPage 計算的。
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
    orderBy,
    category,
  };
};

router.get("/api",async (req,res)=>{
  const data = await getListData(req);
  res.json(data);
});

//可成功抓到點擊的那筆資料
router.get('/api/:products_id', async(req,res)=>{
  //這是一個 GET 請求的路由定義，路由的路徑為 /api/:products_id，:products_id 是一個動態路由參數，用於接收產品的唯一識別碼。
  const products_id = +req.params.products_id || 0
  //請求參數中獲取產品識別碼。req.params.products_id 包含了路由中的動態參數值，+ 用於將其轉換為數字類型，如果轉換失敗則為 0。
  if(!products_id){
    return res.json({success:false})
  }
   
  //try { ... } catch (error) { ... }: 這是 JavaScript 中的錯誤處理機制，try 區塊中的程式碼是被監控的，如果有錯誤發生，會跳到 catch 區塊來處理錯誤。
  try {
    // 執行查詢以獲取特定產品的數據
    const sql = `SELECT * FROM products WHERE products_id = ?`;
    const [rows] = await db.query(sql, [products_id]);
    //這行程式碼是執行 SQL 查詢的地方。db 可能是一個資料庫連線物件，query 方法用來執行 SQL 查詢。await 用來等待這個查詢完成，因為這個查詢可能需要時間。查詢的結果會被儲存在 rows 這個變數中。

    // 檢查是否找到了相應的產品
    if (!rows || rows.length === 0) {
      return res.json({ success: false, error: 'Product not found' });
    }
    // 返回成功響應和產品數據
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching product data:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
})
//這部分是一個條件判斷，如果 products_id 為偽值（即 0 或未定義），則返回一個 JSON 响應，表示請求失敗（success 設置為 false）。

//res.json({ success: true, data: rows[0] })：最後，這行程式碼將成功的 JSON 响應返回給客戶端。如果有找到對應的產品資料，則 success 設置為 true，並將資料作為 data 的值返回。


router.get('/smiler', async (req, res) => {
  const product_class = req.query.product_class || ''
  const product_type = req.query.product_type || ''

  console.log('Received parameter:', product_class, product_type)
  if (!product_class || !product_type) {
    return res.json({ success: false, message: '缺少商品種類' })
  }
  //輸出接收到的 pet_color 和 pet_type 參數的值，以便於調試和確認。接著，它檢查 pet_color 和 pet_type 是否存在，如果其中任一個缺失，則返回一個 JSON 物件，該物件指示請求失敗，並包含一條錯誤訊息，

  let where = ' WHERE 1 '
  if (product_class && product_type) {
    where += ` AND (
          \`product_class\` = ${db.escape(`${product_class}`)}
          AND
          \`product_type\` = ${db.escape(`${product_type}`)}
      )`
  }
  //如果 product_class 和 product_type 都存在，則將其添加到 SQL 查詢的 WHERE 條件中，以確保返回的結果符合這兩個條件


  // SELECT * FROM pet_info WHERE pet_type='貓' OR pet_color='橘' ORDER BY pet_id DESC;
  const sql = `SELECT * FROM products ${where} ORDER BY products_id DESC`
  console.log(sql)


  const [rows] = await db.query(sql)
  if (!rows.length) {
    return res.json({ success: false, message: '不存在此條件' })
  }

  res.json({
    success: true,
    product_class: product_class,
    product_type: product_type,
    data: rows,

})

})
router.get('/orderbyASC', async (req, res) => {
  try {
    // 執行 SQL 查詢
    const sql = `SELECT * FROM products ORDER BY product_price ASC`;
    const [rows] = await db.query(sql);
    const data = await getListData(req);
    res.json({  ...data });
  } catch (error) {
    console.error('Error executing SQL query:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/orderbyDESC', async (req, res) => {
  try {
    // 執行 SQL 查詢
    const sql = `SELECT * FROM products ORDER BY product_price DESC`;
    const [rows] = await db.query(sql);
    const data = await getListData(req);
    res.json({ ...data });
  } catch (error) {
    console.error('Error executing SQL query:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

//喜愛路由
router.get("/jwt-product-like", async (req, res) => {
  let member_id=req.query.member_id || 0;
  let where = " WHERE 1 ";

  if (member_id) {
    where += ` AND (
        \`fk_member_id\` = ${db.escape(`${member_id}`)}
    )`;
}else{
  return res.json({ success: false, info: "缺少會員 ID" })}

  const sql = `SELECT * FROM product_likes 
  JOIN members ON product_likes.fk_member_id=members.memberID 
  JOIN products ON product_likes.fk_product_id=products.products_id
  ${where} ORDER BY product_like_id DESC`;
  console.log(sql)


  const [rows] = await db.query(sql);
    if (!rows.length) {
      return res.json({ success: false, message: '此會員沒有案讚過' });
    }

    res.json({ success: true,  data: rows});
  });

  router.get("/jwt-product-like/:products_id", async (req, res) => {

    //const fk_member_id = 20;//測試時假資料
    const output = {
      success: false,
      action: "",
      info: "",
    };
    // 如果沒有登入
    if(! res.locals.jwt?.id) {
      output.info = "沒有登入";
      return res.json(output);
    }
    console.log(res.locals.jwt);
    const fk_member_id = res.locals.jwt.id; // 會員的 primary key
   console.log(fk_member_id);
    const products_id = +req.params.products_id || 0;
    if (!products_id) {
      output.info = "錯誤的商品編號";
      return res.json(output);
    }
  
    // 先判斷有沒有該項商品
    const p_sql = `SELECT products_id FROM products WHERE products_id=?`;
    const [p_rows] = await db.query(p_sql, [products_id]);
    if (!p_rows.length) {
      output.info = "沒有該商品";
      return res.json(output);
    }
  
    const sql = `SELECT * FROM product_likes WHERE fk_product_id=? AND fk_member_id=?`;
    const [rows] = await db.query(sql, [products_id, fk_member_id]);
  
    if (rows.length) {
      // 移除
      output.action = "remove";
      const [result] = await db.query(
        `DELETE FROM product_likes WHERE product_like_id=${rows[0].product_like_id}`
      );
      output.success = !!result.affectedRows;
    } else {
      // 加入
      output.action = "add";
      const sql = `INSERT INTO product_likes (fk_product_id, fk_member_id,created_at) VALUES (?, ?,NOW()) `;
      const [result] = await db.query(sql, [products_id, fk_member_id]);
      output.success = !!result.affectedRows;
    }
    res.json(output);
    });
  
  


export default router;
