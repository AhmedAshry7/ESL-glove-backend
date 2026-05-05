import sys
import os
import json
import pickle
from datetime import datetime

def main():
    if len(sys.argv) < 5:
        print(json.dumps({"error": "Insufficient arguments"}))
        return

    folder_path = os.path.normpath(sys.argv[1])
    model_name = sys.argv[2]    
    base_mid= sys.argv[3]
    user_id = sys.argv[4]

    try:
        if not os.path.exists(folder_path):
            print(json.dumps({"error": f"Path {folder_path} not found"}))
            return

        json_files = [f for f in os.listdir(folder_path) if f.endswith('.json')]
        
        # 1. Prepare Metadata
        metadata = {
            "model_name": model_name,
            "user_id": user_id,
            "base_mid": base_mid,
            "training_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "samples_found": len(json_files),
            "directory": folder_path
        }

        # 2. Save the Pickle file
        pickle_filename = f"{model_name}_model.pkl"
        pickle_path = os.path.join(folder_path, pickle_filename)

        with open(pickle_path, 'wb') as f:
            pickle.dump(metadata, f)

        # 3. VERIFICATION: Read it back to be 100% sure
        with open(pickle_path, 'rb') as f:
            verified_data = pickle.load(f)
        
        # 4. Final Output to Node.js
        # We include the directory and the verified metadata in the output
        result = {
            "success": True,
            "created_in": folder_path,
            "pickle_file": pickle_filename,
            "verified_metadata": verified_data 
        }
        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()