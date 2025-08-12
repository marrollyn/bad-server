import { Request, Express, NextFunction, Response } from 'express'
import multer, { FileFilterCallback } from 'multer'
import path, { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import sharp from 'sharp'
import BadRequestError from '../errors/bad-request-error'

const MIN_FILE_SIZE = 2 * 1024 // 2 KB
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

const ensureDirectoryExists = (directory: string) => {
    if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true })
}

type DestinationCallback = (error: Error | null, destination: string) => void
type FileNameCallback = (error: Error | null, filename: string) => void

const storage = multer.diskStorage({
    destination: (
        _req: Request,
        _file: Express.Multer.File,
        cb: DestinationCallback
    ) => {
        const uploadPath = process.env.UPLOAD_PATH_TEMP
            ? `../public/${process.env.UPLOAD_PATH_TEMP}`
            : '../public'
        const fullPath = join(__dirname, uploadPath)
        ensureDirectoryExists(fullPath)
        cb(null, fullPath)
    },

    filename: (
        _req: Request,
        file: Express.Multer.File,
        cb: FileNameCallback
    ) => {
        cb(null, uuidv4() + path.extname(file.originalname))
    },
})

const types = [
    'image/png',
    'image/jpg',
    'image/jpeg',
    'image/gif',
    'image/svg+xml',
]

const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    if (!types.includes(file.mimetype)) {
        return cb(null, false)
    }

    return cb(null, true)
}

const limits = { fileSize: MAX_FILE_SIZE }

export const checkMinFileSize = (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    const length = req.headers['content-length']
    if (length && parseInt(String(length), 10) < MIN_FILE_SIZE) {
        return next(new BadRequestError('File size is too small'))
    }
    next()
}

export const checkImageContent = async (
    req: Request,
    _res: Response,
    next: NextFunction
) => {
    if (req.file) {
        const filePath = path.join(
            __dirname,
            '../public/temp',
            req.file.filename
        )
        try {
            const buffer = fs.readFileSync(filePath)
            const metadata = await sharp(buffer).metadata()
            if (!metadata.width || !metadata.height) {
                return next(new BadRequestError('Invalid image content'))
            }
        } catch {
            return next(new BadRequestError('Invalid image content'))
        }
    }
    next()
}

export const upload = multer({ storage, fileFilter, limits })
