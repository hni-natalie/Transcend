const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const WHISPER_URL = "http://t_whisper:8000/transcribe";


const whisperService = {
    async transcribe(fileUrl) {
        const tempPath = path.join(
            "/tmp",
            `recording-${Date.now()}.mp4`
        );

        try {
            console.log("[WHISPER] Downloading recording...");

            // Download mp4 from Supabase
            const response = await axios({
                method: "GET",
                url: fileUrl,
                responseType: "stream",
            });

            const writer = fs.createWriteStream(tempPath);

            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on("finish", resolve);
                writer.on("error", reject);
            });

            console.log("[WHISPER] Sending file to Whisper...");

            // Create multipart form-data
            const form = new FormData();

            form.append(
                "file",
                fs.createReadStream(tempPath)
            );

            const result = await axios.post(
                WHISPER_URL,
                form,
                {
                    headers: form.getHeaders(),
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity,
                }
            );

            console.log("[WHISPER] Completed");

            return result.data.text;
        } catch (error) {
            console.error( "[WHISPER] Failed:", error.message );
            throw error;
        } finally {
            // Remove temporary mp4
            if (fs.existsSync(tempPath)) { fs.unlinkSync(tempPath); }
        }
    }
}

module.exports = whisperService;