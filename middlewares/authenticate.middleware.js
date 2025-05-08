import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if(!token) return res.sendStatus(401);

  jwt.verify(token, process.env.SECRET_ACCESS_TOKEN, (err, payload) => {
    if(err) return res.sendStatus(401);
    req.userId = payload.id;
    next();
  });

}