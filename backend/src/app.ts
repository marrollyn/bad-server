import { errors } from 'celebrate'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import path from 'path'
import rateLimit from 'express-rate-limit'
import { DB_ADDRESS } from './config'
import errorHandler from './middlewares/error-handler'
import serveStatic from './middlewares/serverStatic'
import routes from './routes'

const { PORT = 3000 } = process.env
const app = express()

app.use(cookieParser())

// app.use(cors(
//     {
//         origin: ['http://localhost', 'http://localhost:5173'],
//         credentials: true,
//         // methods: ['GET','POST','PUT','PATCH'],
//         // allowedHeaders: ['Content-Type','Authorization','X-CSRF-Token'],
//     }
// ))
app.use(cors({ origin: ['http://localhost', 'http://localhost:5173'], credentials: true }));
// app.use(express.static(path.join(__dirname, 'public')));

const limiter = rateLimit({
  windowMs: 15*60*1000, max: 40
});
app.use(limiter);

app.use(serveStatic(path.join(__dirname, 'public')))

// app.use(urlencoded({ extended: true }))
app.use(express.urlencoded({ limit: '1mb', extended: true }));
app.use(express.json({ limit: '1mb' }));

app.options('*', cors())
app.disable('x-powered-by');
app.use(routes)
app.use(errors())
app.use(errorHandler)

// eslint-disable-next-line no-console

const bootstrap = async () => {
    try {
        await mongoose.connect(DB_ADDRESS)
        await app.listen(PORT, () => console.log('ok'))
    } catch (error) {
        console.error(error)
    }
}

bootstrap()
