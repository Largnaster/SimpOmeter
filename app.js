("use strict");
// import  from '';
import express from "express";
import path from "path";
import morgan from 'morgan';
import cors from 'cors';

const app = express();
app.use(morgan("common"));
app.use(cors());

app.use(express.static(path.join(__dirname, "public")));

app.set("puerto", process.env.PORT || 3300);

app.listen(app.get("puerto"), () => {
  console.log("Application running in port " + app.get("puerto"));
});
