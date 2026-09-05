from fastapi import FastAPI, UploadFile, File
from faster_whisper import WhisperModel
import tempfile
import shutil
import os

app = FastAPI()

model = WhisperModel(
    "base",
    device="cpu",
    compute_type="int8"
)


@app.get("/")
def health():
    return {"status": "Whisper service running"}


@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")

    try:
        shutil.copyfileobj(file.file, temp_file)
        temp_file.close()

        segments, info = model.transcribe(temp_file.name, language="en")

        transcript = " ".join(segment.text for segment in segments)

        return {"text": transcript}

    finally:
        if os.path.exists(temp_file.name):
            os.remove(temp_file.name)