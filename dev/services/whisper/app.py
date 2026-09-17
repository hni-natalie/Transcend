from fastapi import FastAPI, UploadFile, File, Request
from faster_whisper import WhisperModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import tempfile
import shutil
import os

app = FastAPI()

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

model = WhisperModel(
    "base",
    device="cpu",
    compute_type="int8"
)


@app.get("/")
def health():
    return {"status": "Whisper service running"}


@app.post("/transcribe")
@limiter.limit("5/minute")
async def transcribe(request: Request, file: UploadFile = File(...)):
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