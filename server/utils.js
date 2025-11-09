const fs = require('fs')

function writeDataToFile(filename, content) {
    fs.writeFileSync(filename, JSON.stringify(content), 'utf8', (err) => {
        if (err) {
            console.log(err)
        }
    })
}

function getPostData(req) {
    return new Promise((resolve, reject) => {
        try {
            let body = ''
            req.on('data', (chunk) => {
                body += chunk.toString()
            })
            req.on('end', () => {
                // --- THIS IS THE FIX ---
                if (!body) {
                    resolve({}); // Resolve empty object if no body
                    return;
                }
                try {
                    resolve(JSON.parse(body)); // Parse the string into a JSON object
                } catch (jsonError) {
                    reject(new Error("Invalid JSON in request body"));
                }
                // ---------------------
            })
        } catch (error) {
            reject(error) // Corrected from 'err' to 'error'
        }
    })
}

module.exports = {
    writeDataToFile,
    getPostData
}