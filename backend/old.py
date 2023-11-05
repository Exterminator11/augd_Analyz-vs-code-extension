from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline

app = FastAPI()

# Initialize the pipeline outside the request scope
corrector = None

@app.on_event("startup")
async def startup_event():
    global corrector
    corrector = pipeline(
        'text2text-generation',
        'pszemraj/flan-t5-large-grammar-synthesis',
    )

@app.get("/")
async def read_root():
    return {"message": "Welcome to the Text Correction API"}

@app.post("/correct_text")
async def correct_text(request_data: dict):
    input_text = request_data.get('input_text')

    if not input_text:
        raise HTTPException(status_code=400, detail="Input text is missing in the request.")

    if corrector is None:
        raise HTTPException(status_code=500, detail="Model not loaded yet. Please try again later.")

    params = {
        'max_length': 64,
        'repetition_penalty': 1.05,
        'early_stopping': True,
        'num_beams': 100
    }

    result = corrector(input_text, **params)
    corrected_text = result[0]['generated_text']

    return {"corrected_text": corrected_text}

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this with your frontend's origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)