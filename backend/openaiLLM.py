import os
import openai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

openai.api_key = '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'

@app.get("/")
async def read_root():
    return {"message": "Welcome to the Text Generation API"}

@app.post("/generate_text")
async def generate_text(request_data: dict):
    question = request_data.get('question')

    if not question:
        raise HTTPException(status_code=400, detail="Question is missing in the request.")

    response = openai.Completion.create(engine="text-davinci-002", prompt=question, max_tokens=100)
    return {"generated_text": response.choices[0].text.strip()}

@app.post("/time_space_complexity")
async def time_space_complexity(request_data: dict):
    question = request_data.get('question')

    if not question:
        raise HTTPException(status_code=400, detail="Question is missing in the request.")

    # response = openai.Completion.create(engine="davinci", prompt=question, max_tokens=100)
    # return {"generated_text": response.choices[0].text.strip()}
    return {"generated_text": "space_complexity: O(1), time_complexity: O(1)"}

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