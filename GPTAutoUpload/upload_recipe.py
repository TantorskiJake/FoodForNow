from pymongo import MongoClient
import json
import uuid

def connect_to_mongo(uri, db_name):
    client = MongoClient(uri)
    return client[db_name]

def read_recipe_from_file(file_path):
    with open(file_path, 'r') as file:
        return json.load(file)

def generate_unique_id():
    return str(uuid.uuid4())

def insert_recipe(db, collection_name, recipe):
    try:
        collection = db[collection_name]
        recipe["_id"] = generate_unique_id()  # Add a unique ID to the recipe
        print(f"Inserting recipe: {recipe}")  # Debug print
        result = collection.insert_one(recipe)
        return result.inserted_id
    except Exception as e:
        print(f"Error inserting recipe: {e}")
        return None

def main():
    uri = "mongodb+srv://JakeTantorski:JakeTantorski@foodfornowrecipes.i9zgp80.mongodb.net/"
    db_name = "FoodForNow"
    collection_name = "recipes"

    db = connect_to_mongo(uri, db_name)
    print(f"Connected to MongoDB: {db_name}")
    
    recipe = read_recipe_from_file('recipe.json')
    print(f"Loaded recipe: {recipe}")

    inserted_id = insert_recipe(db, collection_name, recipe)
    if inserted_id:
        print(f"Recipe inserted with ID: {inserted_id}")
    else:
        print("Failed to insert recipe.")

if __name__ == "__main__":
    main()
