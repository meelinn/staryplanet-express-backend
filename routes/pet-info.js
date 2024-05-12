import express from "express"
import db from "./../utils/mysql2-connect.js"

const router = express.Router();

const getListData = async (req) => {
  let member_id = 0;  // 預設值為  0
  // if(res.locals.jwt && res.locals.jwt.id) {
  //   // 如果有 JWT 授權
  //   member_id = res.locals.jwt.id;
  // }

  let orderBy=''
  //id,age
  let orderName=''
  //ASC,DESC
  //子查詢:作為查詢喜愛表用
  let subQuery = `
  (
    SELECT * FROM pet_like WHERE fk_member_id=${member_id}
  ) pl `;

  // SELECT * FROM `address_book` WHERE `name` LIKE '%詩涵%'
  let keyword = req.query.keyword || "";
  

  let where = " WHERE 1 ";
  if (keyword) {
    // 避免 SQL injection
    where += ` AND (
    \`pet_name\` LIKE ${db.escape(`%${keyword}%`)} 
    OR
    \`pet_type\` LIKE ${db.escape(`%${keyword}%`)}
    OR
    \`pet_color\` LIKE ${db.escape(`%${keyword}%`)}
    )
    `;
  }


  let query = [];
  //第一版:.join(" OR "))放錯位置
  // if (req.query.pet_color) {
  //   const petColor = Array.isArray(req.query.pet_color) ? req.query.pet_color : [req.query.pet_color];
  //   query.push(petColor.map((v)=>(`(pet_color = ${db.escape(v)})`)).join(" OR "));
  // }

//第二版:沒有使用IN會導致錯誤
  // if (req.query.pet_type) {
  //   const petType = Array.isArray(req.query.pet_type) ? req.query.pet_type : [req.query.pet_type];
  //   const petTypeConditions = petType.map(v => `pet_type = ${db.escape(v)}`);
  //   query.push(`(${petTypeConditions.join(" OR ")})`); 
  // }


  if (req.query.pet_type) {
    const petType = Array.isArray(req.query.pet_type) ? req.query.pet_type : req.query.pet_type.split(',');
    const petTypeConditions = petType.map(v => db.escape(v)).join(', '); 
    query.push(`(pet_type IN (${petTypeConditions}))`);
}
  
  if (req.query.pet_color) {
    const petColor = Array.isArray(req.query.pet_color) ? req.query.pet_color : req.query.pet_color.split(',');
    const petColorConditions = petColor.map(v => db.escape(v)).join(', ');
    query.push(`(pet_color IN (${petColorConditions}))`);
}


if (req.query.pet_gender) {
  const petGender = Array.isArray(req.query.pet_gender) ? req.query.pet_gender : req.query.pet_gender.split(',');
  const petGenderConditions = petGender.map(v => db.escape(v)).join(', ');
  query.push(`(pet_gender IN (${petGenderConditions}))`);
}
  
  // if (req.query.pet_age) {
  //   query.push(`pet_age = ${db.escape(req.query.pet_age)}`);
  // }

  if (req.query.shelter_address) {
    const shelterAddress = Array.isArray(req.query.shelter_address) ? req.query.shelter_address : req.query.shelter_address.split(',');
    const shelterAddressConditions = shelterAddress.map(v => `shelter_address LIKE ${db.escape('%' + v + '%')}`).join(' OR ');
    query.push(`(${shelterAddressConditions})`);
}


    // 如果有查询条件，则将其添加到 SQL 查询语句中
    if (query.length > 0) {
      where  += " AND " + query.join(" AND ");
    }

  let redirect = ""; // 作為轉換依據的變數
  const perPage =12; // 每頁最多幾筆
  const sql = `SELECT COUNT(1) totalRows FROM pet_info JOIN shelter_info ON pet_info.fk_shelter_id = shelter_info.shelter_id ${where}`;
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
    //原始本的SQL2
    // const sql2 = `SELECT * FROM pet_info JOIN shelter_info ON pet_info.fk_shelter_id = shelter_info.shelter_id ${where} ORDER BY pet_id DESC LIMIT ${
    //   (page - 1) * perPage
    // }, ${perPage}`;

    //加入喜愛清單的SQL2 //子查詢一定要用別名
   const sql2 = `SELECT pi.*,pl.pet_like_id FROM 
   pet_info pi
   JOIN shelter_info AS si ON pi.fk_shelter_id = si.shelter_id
   LEFT JOIN ${subQuery} ON pi.pet_id = pl.fk_pet_id
   ${where} ORDER BY pet_id DESC LIMIT ${
      (page - 1) * perPage
    }, ${perPage}`;
    
    [rows] = await db.query(sql2);
    console.log(sql2);
  }

  
  console.log(sql);

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

// router.get("/query",async (req,res)=>{
//   const data = await getListData(req);
//   let query = req.query.query || "";
//   if (query) {
//     // 避免 SQL injection
//     where += ` AND (
//     \`pet_gender\` = ${db.escape(`${query}`)||''}
//     AND
//     \`pet_type\` = ${db.escape(`${query}`)||''}
//     AND
//     \`pet_color\` = ${db.escape(`${query}`)||''}
//     AND
//     \`pet_age\` >= ${db.escape(`${query}`)||''}
//     AND
//     \`pet_age\` <= ${db.escape(`${query}`)||''}
//     AND
//     \`shelter_address\` = ${db.escape(`${query}`)||''}
//     )
//     `;
//   }
//   res.json({success:true,data:r,query});
// });

// router.get("/api/:pet_id", async (req, res) => {
//   const pet_id = +req.params.pet_id || 0;
//   console.log('Received pet_id:', pet_id);
//   if(! pet_id){
//     return res.redirect("undefined");
//  }
// if(!rows.length){return res.redirect('undefined')}

//   const sql = `SELECT * FROM pet_info WHERE pet_id=${pet_id}`;
//   const [rows] = await db.query(sql);
 
//   res.json(data);
// });

router.get("/api/:pet_id", async (req, res) => {
  const pet_id  = +req.params.pet_id || 0;
  if(! pet_id ){
    return res.json({success:false});
  }
  const sql = `SELECT * FROM pet_info JOIN shelter_info ON pet_info.fk_shelter_id = shelter_info.shelter_id WHERE pet_id=${pet_id}`;
  const [rows] = await db.query(sql);
  if(! rows.length){
    return res.json({success:false});
  }
  const r = rows[0];
 
  res.json({success:true,data:r});
});


//喜愛路由
router.get("/jwt-pet-like", async (req, res) => {
  let member_id=req.query.member_id || 155;
  let where = " WHERE 1 ";
  
  if (member_id) {
    where += ` AND (
        \`fk_member_id\` = ${db.escape(`${member_id}`)}
    )`;
}else{
  return res.json({ success: false, info: "缺少會員 ID" })}

  const sql2 = `SELECT * FROM pet_like 
  JOIN members ON pet_like.fk_member_id=members.memberID 
  JOIN pet_info ON pet_like.fk_pet_id=pet_info.pet_id
  ${where} ORDER BY pet_like_id DESC `;
  console.log(sql2)


  const [rows] = await db.query(sql2);
    if (!rows.length) {
      return res.json({ success: false, message: '此會員沒有案讚過' });
    }

    res.json({ success: true,  data: rows});
  });

router.get("/jwt-pet-like/:pet_id", async (req, res) => {
 
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
  const pet_id = +req.params.pet_id || 0;
  if (!pet_id) {
    output.info = "錯誤的毛孩編號";
    return res.json(output);
  }

  // 先判斷有沒有該項商品
  const p_sql = `SELECT pet_id FROM pet_info WHERE pet_id=?`;
  const [p_rows] = await db.query(p_sql, [pet_id]);
  if (!p_rows.length) {
    output.info = "沒有該毛孩";
    return res.json(output);
  }

  const sql = `SELECT * FROM pet_like WHERE fk_pet_id=? AND fk_member_id=?`;
  const [rows] = await db.query(sql, [pet_id, fk_member_id]);

  if (rows.length) {
    // 移除
    output.action = "remove";
    const [result] = await db.query(
      `DELETE FROM pet_like WHERE pet_like_id=${rows[0].pet_like_id}`
    );
    output.success = !!result.affectedRows;
  } else {
    // 加入
    output.action = "add";
    const sql = `INSERT INTO pet_like (fk_pet_id, fk_member_id) VALUES (?, ?) `;
    const [result] = await db.query(sql, [pet_id, fk_member_id]);
    output.success = !!result.affectedRows;
  }
  res.json(output);
  });



  

router.get("/smiler", async (req, res) => {
    const pet_color = req.query.pet_color || "";
    const pet_type = req.query.pet_type || "";
    
    console.log('Received parameter:', pet_color,pet_type);
    if (!pet_color || !pet_type) {
      return res.json({ success: false, message: '缺少毛色或種類' });
    }
  
    let where = " WHERE 1 "; 
    if (pet_color && pet_type) {
      where += ` AND (
          \`pet_type\` = ${db.escape(`${pet_type}`)}
          AND
          \`pet_color\` = ${db.escape(`${pet_color}`)}
      )`;
  }

    // SELECT * FROM pet_info WHERE pet_type='貓' OR pet_color='橘' ORDER BY pet_id DESC;
    const sql = `SELECT * FROM pet_info ${where} ORDER BY pet_id DESC`;
    console.log(sql)


    const [rows] = await db.query(sql);
      if (!rows.length) {
        return res.json({ success: false, message: '不存在此條件' });
      }

      res.json({ success: true, pet_color:pet_color , pet_type:pet_type , data: rows});

  
  });



export default router;

