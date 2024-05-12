import jwt from "jsonwebtoken";

const key = "wjfkj234jakljkl12";

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoicGV0ZXIiLCJpZCI6MTcsImlhdCI6MTcxMDc0MjA1OH0.F7GwsucFaB8S5ISqi8Cx0E7h0CvLm1pMVOQiO3gkFUM';

    // JWT 解密
const payload = jwt.verify(token, key);

console.log({payload});