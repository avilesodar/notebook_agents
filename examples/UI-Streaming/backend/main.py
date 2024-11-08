import os
from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from langchain.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.output_parsers import StrOutputParser

load_dotenv()
api_claude=os.getenv("api_claude")

template = """
Eres un asistente virtual amigable que respondes las preguntas del usuario de forma coherente y directa.

Pregunta:
{input}
"""

prompt = PromptTemplate(
    input_variables=["input"],
    template=template
)

model = ChatAnthropic(model='claude-3-5-sonnet-20240620',api_key=api_claude,streaming=True)

chain = (
    {"input": RunnablePassthrough()}
    | prompt
    | model
    | StrOutputParser()
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def generate_chat_responses(message):
    async for chunk in chain.astream(message):
        content = chunk.replace("\n", "<br>")
        yield f"data: {content}\n\n"

@app.get("/chat_stream/{message}")
async def chat_stream(message: str):
    return StreamingResponse(generate_chat_responses(message=message), media_type="text/event-stream")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)