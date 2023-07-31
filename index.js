const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const app = express();

app.use(bodyParser.json());
const upload = multer({ dest: 'uploads/' });

const buckets = {};

/**
 * Get an object from the specified bucket.
 * @param {string} bucketName - The name of the bucket.
 * @param {string} Id - The key of the object to retrieve.
 */
app.get('/buckets/:bucketName/objects/:Id', (req, res) => {
    const { bucketName, Id } = req.params;
    if (!buckets[bucketName]) {
        return res.status(404).json({ error: 'Bucket not found' });
    }
    const object = buckets[bucketName].find((obj) => obj.key === Id);
    if (!object) {
        return res.status(404).json({ error: 'Object not found' });
    }
    res.json(object);
});

/**
 * Upload an object to the specified bucket
 * @param {string} bucketName - The name of the bucket.
 * @param {string} Id - The key of the object to be uploaded.
 * @param {File} file - The file to be uploaded.
 */
app.post('/buckets/:bucketName/objects/:Id', upload.single('file'), (req, res) => {
    const { bucketName, Id } = req.params;
    const { path: tempPath, originalname } = req.file;

    if (!buckets[bucketName]) {
        buckets[bucketName] = [];
    }

    const object = { key: Id, filename: originalname, data: [] };
    buckets[bucketName].push(object);

    const writeStream = fs.createWriteStream(`./uploads/${Id}`);
    const readStream = fs.createReadStream(tempPath);

    readStream.pipe(writeStream);

    readStream.on('end', () => {
        fs.unlinkSync(tempPath);
        res.status(201).json({ message: 'Object uploaded successfully' });
    });
});


/**
 * Update an object in the specified bucket.
 * @param {string} bucketName - The name of the bucket.
 * @param {string} Id - The key of the object to be updated.
 * @param {File} file - The updated file.
 */
app.put('/buckets/:bucketName/objects/:Id', upload.single('file'), (req, res) => {
    const { bucketName, Id } = req.params;
    const { path: tempPath, originalname } = req.file;

    if (!buckets[bucketName]) {
        return res.status(404).json({ error: 'Bucket not found' });
    }

    const index = buckets[bucketName].findIndex((obj) => obj.key === Id);
    if (index === -1) {
        return res.status(404).json({ error: 'Object not found' });
    }

    const object = buckets[bucketName][index];
    fs.unlinkSync(`./uploads/${object.key}`);

    object.key = Id;
    object.filename = originalname;
    object.data = [];

    const writeStream = fs.createWriteStream(`./uploads/${Id}`);
    const readStream = fs.createReadStream(tempPath);

    readStream.pipe(writeStream);

    readStream.on('end', () => {
        fs.unlinkSync(tempPath);
        res.status(200).json({ message: 'Object updated successfully' });
    });
});

/**
 * Delete an object from the specified bucket.
 * @param {string} bucketName - The name of the bucket.
 * @param {string} Id - The key of the object to be deleted.
 */
app.delete('/buckets/:bucketName/objects/:Id', (req, res) => {
    const { bucketName, Id } = req.params;
    if (!buckets[bucketName]) {
        return res.status(404).json({ error: 'Bucket not found' });
    }

    const index = buckets[bucketName].findIndex((obj) => obj.key === Id);
    if (index === -1) {
        return res.status(404).json({ error: 'Object not found' });
    }

    const object = buckets[bucketName][index];
    fs.unlinkSync(`./uploads/${object.key}`);
    buckets[bucketName].splice(index, 1);

    res.json({ message: 'Object deleted successfully' });
});

/**
 * List all objects in the specified bucket.
 * @param {string} bucketName - The name of the bucket.
 */
app.get('/buckets/:bucketName', (req, res) => {
    const { bucketName } = req.params;
    if (!buckets[bucketName]) {
        return res.status(404).json({ error: 'Bucket not found' });
    }
    res.json(buckets[bucketName]);
});


app.get('/buckets', (req, res) => {
    res.json(Object.keys(buckets));
});

const port = 7392;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
