import "dotenv/config.js";
// 自己寫的程式要用相對路徑， 下載的程式就直接打他的名稱
import express from "express";
import sales from "./data/sales.json" assert { type: "json" };
// import upload from "./utils/upload-imgs.js";
import admin2Router from "./routes/admin2.js";
import abrouter from "./routes/address-book.js";
import session from "express-session";
import mysql_session from "express-mysql-session";
import moment from "moment-timezone";
import dayjs from "dayjs";
import db from "./utils/mysql2-connect.js";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import productRouter from "./routes/product.js";
import productnopRouter from "./routes/product-nop.js";
import hospitalRouter from "./routes/hospital.js";
import insuranceRouter from "./routes/insurance.js";
import ordersRouter from "./routes/orders.js";
import orders_detailRouter from "./routes/orders_detail.js";
// import shopping_cartRouter from "./routes/shopping_cart.js";
import petInfoRouter from "./routes/pet-info.js";
import multer from "multer";
import path from "path";
import orderRouter from "./routes/order/order.js";
import cartRouter from "./routes/cart/cart.js";
import coupon from "./routes/coupon.js";
import favoriteRouter from "./routes/favorite.js";
import couponRouter from "./routes/coupon/coupon.js";
import linepayRouter from "./routes/order/linepay.js";

// 因為將 session 存在資料表，所以重新啟動時 session 不會消失
// 用 http://localhost:3001/try-sess 測試
const MysqlStore = mysql_session(session);
const sessionStore = new MysqlStore({}, db);

// const upload = multer({ dest: "tmp_uploads" });

const app = express();
app.use(express.static("public"));


const storage = multer.diskStorage ({
    destination: (req, file, cb) => {
        cb(null, 'public/imgs')
    },
    filename: (req, file, cb) => {
        const filename = file.originalname + "_" + Date.now() + path.extname(file.originalname);
        cb(null, filename);
    }
})

const upload  = multer ({
    storage: storage
})


app.post('/upload/:MemberID', upload.single('image'), async (req, res) => {
    try {
        const image = req.file.filename;
        const MemberID = req.params.MemberID; // 從路由參數中獲取會員的 MemberID
        const sql = "UPDATE `members` SET user_photo=? WHERE MemberID=?";
        
        // 執行 SQL 時最好做錯誤處理
        const [result] = await db.query(sql, [image, MemberID]);
        
        console.log("code:0");

        console.log(result);
        if (result.affectedRows > 0) {
            return res.json ({ Status: "Success" });
        } else {
            return res.json ({ Message: "No records updated" });
        }
    } catch (err) {
        console.log("errorrrrrrrr");
        console.error("Error uploading image:", err);
        return res.json ({ Message: "Error uploading image" });
    }
    
});

// const upload = multer({
//   storage: storage,
// });

app.post("/upload/:MemberID", upload.single("image"), async (req, res) => {
  try {
    const image = req.file.filename;
    const MemberID = req.params.MemberID; // 從路由參數中獲取會員的 MemberID
    const sql = "UPDATE `members` SET user_photo=? WHERE MemberID=?";

    // 執行 SQL 時最好做錯誤處理
    const [result] = await db.query(sql, [image, MemberID]);

    console.log("code:0");

    console.log(result);
    if (result.affectedRows > 0) {
      return res.json({ Status: "Success" });
    } else {
      return res.json({ Message: "No records updated" });
    }
  } catch (err) {
    console.log("errorrrrrrrr");
    console.error("Error uploading image:", err);
    return res.json({ Message: "Error uploading image" });
  }
});

app.get("/", async (req, res) => {
  const sql = "SELECT * FROM members";
  try {
    const [result] = await db.query(sql);
    return res.json(result);
  } catch (error) {
    console.error("Error querying database:", error);
    return res.json({ Message: "Error" });
  }
});

app.set("view engine", "ejs"); // 設定使用的樣版引擎為 EJS (需要設定在路由之前)

// *** Top level middlewares 設定
// 可以讓後面不會出現那麼多的中介設定
// true: 使用 qs 套件作為解析器的核心
// flase: 使用 body-parser 自己的解析器
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const corsOptions = {
  credentials: true,
  origin: (origin, callback) => {
    console.log({ origin });
    callback(null, true);
  },
};
app.use(cors(corsOptions)); // 基本款的允許跨來源

app.use(
  session({
    saveUninitialized: false,
    resave: false,
    secret: "770456",
    store: sessionStore,
    /*
    cookie: {
        maxAge: 1200_000, // 單位是毫秒
    }
    */
  })
);

// 自訂頂層的中介軟體
app.use((req, res, next) => {
  res.locals.title = "田中的網站";
  res.locals.pageName = ""; // 預設值是空字串
  res.locals.session = req.session; // 把 session 資料傳到 ejs

  const authorization = req.get("Authorization"); // 取得某個 header
  if (authorization && authorization.indexOf("Bearer") === 0) {
    const token = authorization.slice(7); // 去掉 "Bearer"

    // JWT 解密
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      res.locals.jwt = payload; // 透過 res 往下傳
    } catch (ex) {}
  }

  next(); // 流程往下進行
});

// app.use(express.static('build'));
// app.get("*", (req, res)=>{
//     res.send(`<!doctype html><html lang="zh"><head><meta charset="utf-8"/><link rel="icon" href="/favicon.ico"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="theme-color" content="#000000"/><meta name="description" content="Shinder react hooks"/><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css"/><title>Shinder react hooks</title><script defer="defer" src="/static/js/main.6a205622.js"></script></head><body><noscript>You need to enable JavaScript to run this app.</noscript><div id="root"></div></body></html>`)
// })

// 路由 (routes) 設定
app.use("/product", productRouter);
app.use("/product-nop", productnopRouter);
app.use("/pet-info", petInfoRouter);
app.use("/coupon", coupon);
app.use("/hospital", hospitalRouter);
app.use("/insurance", insuranceRouter);
app.use("/orders_detail", orders_detailRouter);
app.use("/orders", ordersRouter);
// app.use("/shopping_cart", shopping_cartRouter);
app.use("/hospital", hospitalRouter);
app.use("/insurance", insuranceRouter);
app.use("/order", orderRouter);
app.use("/cart", cartRouter);
app.use("/coupon", couponRouter);
app.use("/favorite", favoriteRouter);
app.use("/linepay", linepayRouter);
// 斜線代表跟目錄
// 只允許 GET 方法來拜訪這個路徑
app.get("/", (req, res) => {
  // res.send("<h2>Hello Express</h2>")
  // 使用樣板的話不使用 send 用 render
  res.locals.title = "首頁 - " + res.locals.title;
  res.locals.pageName = "home";
  res.render("home", { name: 'Darren >"<' });
});
app.get("/hello", (req, res) => {
  res.json({ name: "Darren", age: "25" });
});
app.get("/a.png", (req, res) => {
  res.send('<h2 style="color:red">save me</h2>');
});

app.get("/json-sales", (req, res) => {
  res.locals.title = "JSON 測試 -" + res.locals.title;
  res.locals.pageName = "json-sales";
  res.render("json-sales", { sales });
});

app.get("/try-qs", (req, res) => {
  res.json(req.query);
});

// 已由 Top level middlewares 定義中介器
app.post("/try-post", (req, res) => {
  res.json(req.body);
});

app.get("/try-post-form", (req, res) => {
  res.locals.title = "表單資料測試 -" + res.locals.title;
  res.locals.pageName = "try-post-form";

  res.render("try-post-form", { email: "", password: "" });

  // res.render("try-post-form");

  // 也可以像上面那樣，但是html中就要改成
  // <%= typeof email !=='undefined' ? email : "" %>
  // 因為當沒有值金進來 typeof 會顯示字串的 'undefined' 但並不會出錯
});

app.post("/try-post-form", (req, res) => {
  res.render("try-post-form", req.body);
});

// 嚴謹的路徑放前面
// 如果 action?/:id? 沒有加問號就可以隨便放
// 因為加了 ? 所以規則變得寬鬆
app.get("/try-params1/aaa", (req, res) => {
  res.json({ ...req.params, p: 2 });
});
// 此時往只要像 http://localhost:3001/try-params1/edit/12
// action 會拿到網址後第一個值 edit 後者 id 同理
app.get("/try-params1/:action?/:id?", (req, res) => {
  res.json({ ...req.params, p: 1 });
});

app.get(/^\/m\/09\d{2}-?\d{3}-?\d{3}$/i, (req, res) => {
  let u = req.url.slice(3); // 前面三個字元不要 "/m"
  u = u.split("?")[0]; // 在 ? 的地方切一刀， 取第一段
  // 假設 u 的值為 '/m/0902-456-789?param1=value1&param2=value2'，這個 URL 中包含了問號 ?，表示後面可能有查詢參數。通常在網址中，問號後面的部分是查詢參數，用來向服務器傳遞一些附加的信息。但在這段代碼中，我們只想處理問號之前的部分。
  u = u.split("-").join("");
  res.json({ u });
});

app.use("/admins", admin2Router);
app.use("/product", productRouter);
app.use("/product-nop", productnopRouter);

app.get("/try-sess", (req, res) => {
  req.session.num = req.session.num || 0; // 變數沒有設定，就設定為 0
  req.session.num++;
  res.json({
    num: req.session.num,
  });
});

app.get("/sess", (req, res) => {
  res.json(req.session);
});

app.post("/login", async (req, res) => {
  const output = {
    success: false,
    body: req.body,
  };
  const { account, password } = req.body;

  const sql = "SELECT * FROM members WHERE Email=?";
  const [rows] = await db.query(sql, [account]);

  if (!rows.length) {
    // 帳號是錯誤的
    return res.json(output);
  }

  const result = await bcrypt.compare(password, rows[0].Password);
  output.success = result;
  console.log(result);
  if (result) {
    // 密碼是正確的

    // 使用 session 記住用戶
    req.session.admin = {
      id: rows[0].MemberID,
      account,
      Username: rows[0].Username,
    };
  }
  res.json(output);
});

// 登入後回傳 JWT
app.post("/login-jwt", async (req, res) => {
  const output = {
    success: false,
    body: req.body,
  };
  const { account, password } = req.body;
  const sql = "SELECT * FROM members WHERE Email=?";
  const [rows] = await db.query(sql, [account]);

  if (!rows.length) {
    // 帳號是錯誤的
    return res.json(output);
  }

  const result = await bcrypt.compare(password, rows[0].Password);
  output.success = result;
  if (result) {
    const token = jwt.sign(
      {
        id: rows[0].MemberID,
        account,
      },
      process.env.JWT_SECRET
    );

    // 使用 JWT
    output.data = {
      id: rows[0].MemberID,
      account,
      Username: rows[0].Username,
      token,
    };

    // 同時取得性別、地址和電話資訊
    const additionalInfoSql =
      "SELECT Birthday, user_photo, Password, Gender, Address, Phone , Birthday FROM members WHERE MemberID = ?";
    const [additionalInfoRows] = await db.query(additionalInfoSql, [
      rows[0].MemberID,
    ]);
    output.data.Gender = additionalInfoRows[0].Gender;
    output.data.Birthday = additionalInfoRows[0].Birthday;
    output.data.Address = additionalInfoRows[0].Address;
    output.data.Phone = additionalInfoRows[0].Phone;
    output.data.Password = additionalInfoRows[0].Password;
    output.data.Birthday = additionalInfoRows[0].Birthday;
    output.data.user_photo = additionalInfoRows[0].user_photo;
  }
  res.json(output);
});

app.get("/jwt-data", (req, res) => {
  res.json(res.locals.jwt);
});

app.get("/logout", (req, res) => {
  delete req.session.admin; // 移除 admin 這個屬性
  res.redirect("/");
});

app.get("/try-moment", (req, res) => {
  const fm = "YYYY-MM-DD HH:mm:ss"; // 輸出的格式
  const m1 = moment(); // 當下時間的 moment 物件
  const m2 = moment("2024-02-29");
  const d1 = dayjs(); // 建立當下時間的 dayjs 物件
  const d2 = dayjs("2024-02-29"); // 建立當下時間的 dayjs 物件

  res.json({
    m1a: m1.format(fm),
    m1b: m1.tz("Europe/London").format(fm),
    m2: m2.format(fm),
    d1: d1.format(fm),
    d2: d2.format(fm),
  });
});

app.get("/try-db", async (req, res) => {
  const sql = "SELECT * FROM members ORDER BY MemberID DESC LIMIT 3;";

  // promise 處理完後，取得的是陣列，第一個元素會依 sql 語法不同而異
  // SQL SELECT: 第一個值是資料的陣列，第二個值是欄位的資料
  let rows = [];
  let fields; // 通常是不需要取得欄位定義的資料
  try {
    [rows, fields] = await db.query(sql);
  } catch (ex) {
    // console.log(ex);
  }

  res.json({ rows, fields });
});

app.use("/address-book", abrouter);

// 後端讀取別的伺服器的頁面

app.get("/bcrypt1", async (req, res) => {
  const hash = await bcrypt.hash("123456", 10);
  res.json({ hash });
});

app.get("/bcrypt2", async (req, res) => {
  const hash = "$2a$10$I5zGFKGJYn8wf0Q5txOF9.tdqna225AcNgEroF42JESdBEEqVeGRS";
  const result = await bcrypt.compare("123456", hash);
  res.json({ result });
});

app.get("/cate1/:api?", async (req, res) => {
  const data = [];
  const [rows] = await db.query("SELECT * FROM categories ORDER BY sid DESC");

  // 先取得第一層的資料
  for (let item of rows) {
    if (+item.parent_sid === 0) {
      data.push(item);
    }
  }

  // 把第二層的項目放在它所屬的第一層底下
  for (let a1 of data) {
    for (let item of rows) {
      if (+a1.sid === +item.parent_sid) {
        a1.nodes = a1.nodes || [];
        a1.nodes.push(item);
      }
    }
  }
  if (req.params.api === "api") {
    res.json(data);
  } else {
    res.render("cate1", { data });
  }
});

app.get("/cate2", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM categories ORDER BY sid DESC");

  // PK 當 key 的物件, 對表用
  const dict = {};
  for (let i of rows) {
    dict[i.sid] = i;
  }
  // 上下的關係建立起來
  for (let i of rows) {
    // 如果 i 這個項目有上一層
    if (i.parent_sid) {
      const parent = dict[i.parent_sid]; // 取得它的上一層
      parent.nodes ||= [];
      parent.nodes.push(i);
    }
  }

  const data = [];
  for (let i of rows) {
    if (!i.parent_sid) {
      data.push(i);
    }
  }

  res.json(data);
});

app.get("/like-toggle/:pid", async (req, res) => {
  const member_sid = 20; // 測試時的假資料
  const output = {
    success: false,
    action: "",
    info: "",
  };

  const pid = +req.params.pid || 0;
  if (!pid) {
    output.info = "錯誤的商品編號";
    return res.json(output);
  }

  // 先判斷有沒有該項商品
  const p_sql = `SELECT sid FROM products WHERE sid=?`;
  const [p_rows] = await db.query(p_sql, [pid]);
  if (!p_rows.length) {
    output.info = "沒有該商品";
    return res.json(output);
  }

  const sql = `SELECT * FROM product_likes WHERE product_sid=? AND member_sid=?`;
  const [rows] = await db.query(sql, [pid, member_sid]);

  if (rows.length) {
    // 移除
    output.action = "remove";
    const [result] = await db.query(
      `DELETE FROM product_likes WHERE sid=${rows[0].sid}`
    );
    output.success = !!result.affectedRows;
  } else {
    // 加入
    output.action = "add";
    const sql = `INSERT INTO product_likes (product_sid, member_sid) VALUES (?, ?) `;
    const [result] = await db.query(sql, [pid, member_sid]);
    output.success = !!result.affectedRows;
  }
  res.json(output);
});

app.get("/like-toggle-jwt/:pid", async (req, res) => {
  const output = {
    success: false,
    action: "",
    info: "",
  };
  // 如果沒有登入
  if (!res.locals.jwt?.id) {
    output.info = "沒有登入";
    return res.json(output);
  }
  const member_sid = res.locals.jwt.id; // 會員的 primary key

  const pid = +req.params.pid || 0;
  if (!pid) {
    output.info = "錯誤的商品編號";
    return res.json(output);
  }

  // 先判斷有沒有該項商品
  const p_sql = `SELECT sid FROM address_book WHERE sid=?`;
  const [p_rows] = await db.query(p_sql, [pid]);
  if (!p_rows.length) {
    output.info = "沒有該商品";
    return res.json(output);
  }

  const sql = `SELECT * FROM product_likes WHERE product_sid=? AND member_sid=?`;
  const [rows] = await db.query(sql, [pid, member_sid]);

  if (rows.length) {
    // 移除
    output.action = "remove";
    const [result] = await db.query(
      `DELETE FROM product_likes WHERE sid=${rows[0].sid}`
    );
    output.success = !!result.affectedRows;
  } else {
    // 加入
    output.action = "add";
    const sql = `INSERT INTO product_likes (product_sid, member_sid) VALUES (?, ?) `;
    const [result] = await db.query(sql, [pid, member_sid]);
    output.success = !!result.affectedRows;
  }
  res.json(output);
});

// *** 路由放在此段之前 ***
// 設定靜態內容資料夾
app.use("/jquery", express.static("node_modules/jquery/dist"));
app.use("/bootstrap", express.static("node_modules/bootstrap/dist"));
app.use(express.static("public"));
/*
app.get("/a.html", (req, res) => {
    res.send('<h2 style="color:red">這不是</h2>')
});
-------這段放在靜態網頁之前就不會被優先讀取!!!!!!!!!!
*/

// 404 頁面
// *** 此段放在所有路由設定的後面 ***
app.use((req, res) => {
  res.status(404).send("<h2>你是路痴嗎????</h2>");
});

const port = process.env.WEB_PORT || 3005;
app.listen(port, () => {
  console.log(`使用通訊埠 ${port}`);
});
