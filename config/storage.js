import { Storage } from '@google-cloud/storage';
import multer from 'multer';
import path from 'path';

const storage = new Storage({
  projectId: 'righttouch',
  keyFilename: path.join(process.cwd(), 'config', 'gcs-key.json'),
});

const bucketName = process.env.GCS_BUCKET_NAME || 'righttouch';
const bucket = storage.bucket(bucketName);

const multerStorage = multer.memoryStorage();
export const upload = multer({ storage: multerStorage });

export const uploadToGCS = async (req, res, next) => {
  if (!req.files && !req.file) return next();

  try {
    const uploadFile = async (file) => {
      const ext = path.extname(file.originalname);
      const filename = `aadvi-atelier/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      const blob = bucket.file(filename);
      
      await blob.save(file.buffer, {
        resumable: false,
        metadata: { contentType: file.mimetype }
      });
      
      await blob.makePublic();
      file.path = `https://storage.googleapis.com/${bucketName}/${filename}`;
    };

    if (req.file) {
      await uploadFile(req.file);
    } else if (req.files) {
      for (const fieldname in req.files) {
        for (const file of req.files[fieldname]) {
          await uploadFile(file);
        }
      }
    }
    next();
  } catch (error) {
    console.error('GCS Upload Error:', error);
    next(error);
  }
};
