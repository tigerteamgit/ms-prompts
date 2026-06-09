import express from "express";

console.log("FILE LOADED:", new Date().toISOString());

const app = express();

/* HARD PROOF ROUTE */
app.get("/test", (req, res) => {
  console.log("ROUTE HIT");
  res.send("WORKING");
});

/* START */
app.listen(3000, () => {
  console.log("LISTENING ON 3000");
});
