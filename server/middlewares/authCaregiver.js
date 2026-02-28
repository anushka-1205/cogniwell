import jwt from "jsonwebtoken";
import "dotenv/config";

const authCaregiver = async (req, res, next) => {
  const { caregiver_token } = req.cookies;

  if (!caregiver_token) {
    return res.json({ success: false, message: "Not Authorized (no token)" });
  }

  try {
    const decoded = jwt.verify(caregiver_token, process.env.JWT_SECRET);

    if (decoded.id) {
      req.caregiverId = decoded.id;
      next();
    } else {
      return res.json({ success: false, message: "Not Authorized (invalid token payload)" });
    }
  } catch (error) {
    return res.json({ success: false, message: "Invalid or expired token" });
  }
};

export default authCaregiver;
