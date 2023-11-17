import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain import HuggingFaceHub, PromptTemplate, LLMChain
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferWindowMemory
import re

app = FastAPI()

os.environ["HUGGINGFACE_HUB_TOKEN"] = "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"
model_id = "mistralai/Mistral-7B-Instruct-v0.1"

# template = """{question}"""

template = """
Current Conversation :
{history}
Human : {question}
"""
prompt = PromptTemplate(template=template, input_variables=["history","question"])

mistral_llm = HuggingFaceHub(
    huggingfacehub_api_token=os.environ["HUGGINGFACE_HUB_TOKEN"],
    repo_id=model_id,
    model_kwargs={"max_new_tokens": 500, "temperature": 0.2},
)

# mistral_chain = LLMChain(llm=mistral_llm, prompt=prompt)
mistral_chain = ConversationChain(
    llm=mistral_llm, 
    # prompt=prompt, 
    memory=ConversationBufferWindowMemory(k=5)
)


def get_code_and_text(response):
    code = re.findall(r"```(.+?)```", response, re.DOTALL)
    text = re.sub(r"```(.+?)```", "", response, flags=re.DOTALL)
    return "".join(code), text


@app.get("/")
async def read_root():
    return {"message": "Welcome to the Text Generation API"}


@app.post("/generate_text")
async def generate_text(request_data: dict):
    question = request_data.get("question")

    if not question:
        raise HTTPException(
            status_code=400, detail="Question is missing in the request."
        )

    response = mistral_chain.run(f"[INST]{question}[/INST]")
    # response = mistral_chain(f"[INST]{question}[/INST]")["response"]

    code, text = get_code_and_text(response)
    return {"text": text, "code": code}


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
