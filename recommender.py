import os
from dotenv import load_dotenv
from supabase import create_client
from sentence_transformers import SentenceTransformer

# 1. Setup
load_dotenv()
URL = os.getenv("SUPABASE_URL", "https://eklgsshwrknfglpmjogf.supabase.co")
KEY = os.getenv("SUPABASE_KEY", "sb_secret_5iCZf8lDPnuc__Y1_gwuJg_nzqNFzAD")
supabase = create_client(URL, KEY)

# Load the same model used in migration.py
model = SentenceTransformer('all-MiniLM-L6-v2')

def get_recommendations(user_input, limit=5):
    print(f"🔍 Searching for: {user_input}...")
    
    # Convert user's skills/requirement into a mathematical vector
    query_vector = model.encode(user_input).tolist()

    # Call the SQL function we just created in Supabase
    try:
        response = supabase.rpc("match_jobs", {
            "query_embedding": query_vector,
            "match_threshold": 0.4, # Adjust this (0.0 to 1.0) for strictness
            "match_count": limit
        }).execute()

        return response.data
    except Exception as e:
        print(f"❌ Error during search: {e}")
        return []

if __name__ == "__main__":
    # TEST CASE: Imagine a user searching for a job
    my_skills = "Python developer with experience in Django and SQL in Indore"
    
    results = get_recommendations(my_skills)

    if results:
        print(f"\n✅ Found {len(results)} matches for you:\n")
        for i, res in enumerate(results, 1):
            print(f"{i}. {res['job_title']} at {res['company_name']}")
            print(f"   Location: {res['location']} | Match Score: {round(res['similarity'] * 100, 2)}%\n")
    else:
        print("No matches found. Try broadening your search!")