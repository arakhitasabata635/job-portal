import app from "./app.js";
import dotenv from "dotenv";

dotenv.config();

app.listen(process.env.PORT, () => {
  console.log(
    `auth server is running on https://localhost:${process.env.PORT}`,
  );
});
