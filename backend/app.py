import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain import HuggingFaceHub, PromptTemplate, LLMChain
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferWindowMemory
import re
from gtts import gTTS
from io import BytesIO
import io
from fastapi.responses import StreamingResponse

app = FastAPI()

os.environ["HUGGINGFACE_HUB_TOKEN"] = "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"
model_id = "mistralai/Mistral-7B-Instruct-v0.1"

# ! CHANGED TEMPLATE FOR CONTEXT
# template = """
# Current Conversation :
# {history}
# Human :[INST]{question}[/INST]
# """

template = """
Current Conversation :
{history}
Human : [INST]{question}[/INST]
"""

# ! ADDED HISTORY
prompt = PromptTemplate(template=template, input_variables=["history", "question"])


mistral_llm = HuggingFaceHub(
    huggingfacehub_api_token=os.environ["HUGGINGFACE_HUB_TOKEN"],
    repo_id=model_id,
    model_kwargs={"max_new_tokens": 500, "temperature": 0.2},
)


# ! ADDED MEMORY
mistral_chain = ConversationChain(
    llm=mistral_llm,
    # prompt=prompt,
    memory=ConversationBufferWindowMemory(k=5),
)


# seperate code and text
def get_code_and_text(response):
    code = re.findall(r"```(.+?)```", response, re.DOTALL)
    text = re.sub(r"```(.+?)```", "", response, flags=re.DOTALL)
    return "".join(code), text


@app.get("/")
async def read_root():
    return {"message": "Welcome to the Text Generation API"}


# ! USED FOR CHAT CALLS
@app.post("/generate_text")
async def generate_text(request_data: dict):
    question = request_data.get("question")
    temp = f"<s>[INST] {question} [/INST] </s>[INST]Ensure the response length is appropriate and not overly detailed.Incorporate conversational memory selectively, activating it judiciously for enhanced user experience without compromising efficiency. Avoid incorporating converstaions in the response[/INST]"

    if not question:
        raise HTTPException(
            status_code=400, detail="Question is missing in the request."
        )

    try:
        response = mistral_chain.run(temp)
    except:
        response = "Please try again."
    code, text = get_code_and_text(response)
    return {"text": text, "code": code}


# ! USED FOR ALGORITHM CALLS
@app.post("/algorithm_complexity")
async def getComplexity(request_data: dict):
    function_name = request_data.get("function_name")
    programming_language = request_data.get("programming_language")
    function_code = request_data.get("function_code")

    if not function_name or not programming_language or not function_code:
        raise HTTPException(
            status_code=400, detail="Required data is missing in the request."
        )

    prompt = f"""
    <s>[INST] Given the function name "{function_name}" and the following code:

    ```{programming_language}
    {function_code}
    ```
    Please provide the time complexity of this function, explaining how you arrived at this conclusion.
    Please provide the space complexity of this function, explaining how you arrived at this conclusion.
    If there are any areas where the function's performance in terms of time and space could be improved, please identify them and suggest alternative approaches. [/INST]
    """

    response = mistral_chain.run(prompt)
    return {"generated_text": response}

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
