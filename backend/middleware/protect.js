import jwt from "jsonwebtoken";

const protect = (req, res, next) => {
  let token;

  // 🔥 Get token from header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 STRUCTURED USER OBJECT (IMPORTANT FIX)
    req.user = {
      id: decoded.id,
      role: decoded.role,
      department: decoded.department,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Token failed or expired" });
  }
};

export default protect;