// In a new file, e.g., /utils/s3Upload.js
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
require('dotenv').config(); // Ensure env variables are loaded

// 1. Create the S3 Client
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

/**
 * Uploads a file to S3
 * @param {object} file - The file object from formidable (e.g., files.thumbnailImage)
 * @param {string} s3Key - The desired filename in S3 (e.g., "1234567890123.jpg")
 * @returns {string} The public URL of the uploaded file
 */
async function uploadToS3(file, s3Key) {
    if (!file) throw new Error("No file provided for upload.");

    try {
        const fileStream = fs.createReadStream(file.filepath);

        const uploadParams = {
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: fileStream,
            ContentType: file.mimetype // formidable helpfully provides this
        };

        // 3. Send the command
        await s3Client.send(new PutObjectCommand(uploadParams));

        // 4. Construct and return the public URL
        const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
        console.log(`Successfully uploaded to: ${publicUrl}`);
        return publicUrl;

    } catch (error) {
        console.error("Error uploading to S3:", error);
        throw new Error("S3 upload failed.");
    }
}

module.exports = { uploadToS3 };