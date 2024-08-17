from pymongo import MongoClient
import json

def connect_to_mongo(uri, db_name):
    """Connect to MongoDB!"""
    client = MongoClient(uri)
    return client[db_name]

def insert_recipe(db, collection_name, recipe):
    """Insert a recipe into the specified MongoDB collection."""
    collection = db[collection_name]
    result = collection.insert_one(recipe)
    return result.inserted_id

def read_recipe_from_file(file_path):
    """Read recipe data from a JSON file."""
    with open(file_path, 'r') as file:
        recipe = json.load(file)
    return recipe

def read_recipe_from_string(recipe_string):
    """Parse recipe data from a JSON string."""
    recipe = json.loads(recipe_string)
    return recipe

def main():
    # MongoDB connection parameters
    uri = "mongodb+srv://JakeTantorski:JakeTantorski@foodfornowrecipes.i9zgp80.mongodb.net/?ssl=true&ssl_cert_reqs=CERT_NONE" # Replace with your MongoDB URI
    db_name = "recipes_db"
    collection_name = "recipes"

    # Connect to MongoDB
    db = connect_to_mongo(uri, db_name)

    # Read recipe data (choose one method)
    recipe = read_recipe_from_file('recipe.json')  # Uncomment this line if using a file
    
    # Insert the recipe into MongoDB
    inserted_id = insert_recipe(db, collection_name, recipe)
    print(f"Recipe inserted with ID: {inserted_id}")

if __name__ == "__main__":
    main()
