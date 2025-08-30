from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello World from Vercel!"}

@app.get("/api/test")
def test_endpoint():
    return {"status": "success", "message": "API is working on Vercel"}