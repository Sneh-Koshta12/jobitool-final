import pandas as pd
from supabase import create_client
from sentence_transformers import SentenceTransformer
import numpy as np

# 1. Initialize Supabase and AI Model
URL = "https://eklgsshwrknfglpmjogf.supabase.co" 
KEY = "sb_secret_5iCZf8lDPnuc__Y1_gwuJg_nzqNFzAD" 
supabase = create_client(URL, KEY)

model = SentenceTransformer('all-MiniLM-L6-v2')

def clean_experience(exp_val):
    """Simple parser to extract numbers from experience strings"""
    try:
        import re
        nums = re.findall(r'\d+', str(exp_val))
        if len(nums) >= 2: return int(nums[0]), int(nums[1])
        if len(nums) == 1: return int(nums[0]), int(nums[0])
    except:
        pass
    return 0, 15

def migrate_data(file_path):
    print("🚀 Reading Job Dataset...")
    df = pd.read_csv(file_path)
    
    # Fill any missing text values with empty strings to prevent errors
    df.fillna("", inplace=True)

    print("🧠 Generating AI Vectors... (This takes about 2-5 mins)")
    
    # Updated to match your exact column names from the image
    df['text_for_ai'] = (
        (df['job_title'] + " ") * 3 + 
        (df['skills'] + " ") * 2 + 
        df['location']
    ).str.lower()

    # Generate Embeddings
    embeddings = model.encode(df['text_for_ai'].tolist(), show_progress_bar=True)

    jobs_to_insert = []
    print("📦 Preparing batch data...")

    for i, row in df.iterrows():
        min_e, max_e = clean_experience(row['experience_required_years'])
        
        job_data = {
            "job_title": row['job_title'],
            "company_name": row['company_name'], # Assuming 'company_' is 'company_name'
            "role": row['job_title'],
            "location": row['location'],
            "work_type": row.get('employment_type', 'Full-time'), # Assuming 'employme...'
            "min_exp": min_e,
            "max_exp": max_e,
            "combined_text": df['text_for_ai'][i],
            "embedding": embeddings[i].tolist() 
        }
        jobs_to_insert.append(job_data)

    # 4. Batch Upload to Supabase 
    # 4. Batch Upload to Supabase 
    print(f"📤 Uploading {len(jobs_to_insert)} records to Supabase...")
    
    batch_size = 50  # <--- CHANGED FROM 500 TO 50
    
    for i in range(0, len(jobs_to_insert), batch_size):
        batch = jobs_to_insert[i : i + batch_size]
        
        # Adding a try-except block to handle occasional network hiccups cleanly
        try:
            supabase.table("jobs").insert(batch).execute()
            print(f"✅ Uploaded rows {i} to {i + len(batch)}")
        except Exception as e:
            print(f"⚠️ Failed at row {i}. Error: {e}")

if __name__ == "__main__":
    # Make sure this matches your file name!
    migrate_data("indiajobmarketdata.csv")