import app from "./src/app.js"
import connectToDb from "./src/db/db.js";


connectToDb()

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
