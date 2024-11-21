import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

//use is used for middlewares and for configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials : true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.static("public"))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(cookieParser())


// routes import
import userRouter from "./routes/user.routes.js"
import cartRouter from "./routes/cart.routes.js"
import productRouter from "./routes/product.routes.js"


// routes declarations
app.use("/api/v1/users",userRouter)
app.use("/api/v1/cart",cartRouter)
app.use("/api/v1/product",productRouter)


export {app}
