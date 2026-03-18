import os
import io
import pdfplumber
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

# 1. Initialization
load_dotenv()
app = FastAPI(title="Job & Candidate AI Matching API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

URL = os.getenv("SUPABASE_URL", "https://eklgsshwrknfglpmjogf.supabase.co")
KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrbGdzc2h3cmtuZmdscG1qb2dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxMjcxNzUsImV4cCI6MjA4NzcwMzE3NX0.gILCRB5rf0IPgn1q5yfHnm59fuqm5PklSAxjrYLG6Oc") # Make sure your key is correct
supabase: Client = create_client(URL, KEY)

print("🧠 Loading AI Model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("✅ AI Model Ready!")

# ==========================================
# SIDE 1: CANDIDATES (Upload Resume & Search Jobs)
# ==========================================

@app.post("/upload-resume/")
async def upload_resume(
    full_name: str = Form(...),
    location: str = Form(...),
    experience_years: int = Form(...),
    preferred_role: str = Form(...),
    file: UploadFile = File(...)
):
    try:
        pdf_bytes = await file.read()
        extracted_text = ""
        
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + " "

        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF.")

        resume_text = " ".join(extracted_text.split())
        combined_profile = f"{full_name} is a {preferred_role} in {location} with {experience_years} years experience. Resume: {resume_text}"
        
        embedding = model.encode(combined_profile).tolist()

        data = {
            "full_name": full_name,
            "location": location,
            "experience_years": experience_years,
            "preferred_role": preferred_role,
            "resume_summary": resume_text[:1000],
            "embedding": embedding
        }

        response = supabase.table("candidates").insert(data).execute()
        return {"message": "Success!", "candidate_id": response.data[0]['id']}
        
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/search-jobs/")
async def search_jobs(query: str, limit: int = 5):
    """Candidates use this to find jobs matching their skills."""
    try:
        query_vector = model.encode(query).tolist()
        response = supabase.rpc("match_jobs", {
            "query_embedding": query_vector,
           "match_threshold": 0.0, # Lowered so it always shows results for the demo
            "match_count": limit
        }).execute()
        return {"matches": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# SIDE 2: HR / COMPANIES (Search Candidates)
# ==========================================

@app.get("/search-candidates/")
async def search_candidates(query: str, limit: int = 5):
    """HR uses this to find candidates matching their job description."""
    try:
        query_vector = model.encode(query).tolist()
        response = supabase.rpc("match_candidates", {
    "query_embedding": query_vector,
    "match_threshold": 0.20,  # <-- Lowered to catch short test resumes!
    "match_count": limit
}).execute()
        return {"matches": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))