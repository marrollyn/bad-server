import { Router } from 'express'
import { uploadFile } from '../controllers/upload'
import { checkImageContent, checkMinFileSize, upload } from '../middlewares/file';

const uploadRouter = Router();
uploadRouter.post('/', checkMinFileSize, upload.single('file'), checkImageContent, uploadFile);

export default uploadRouter;
