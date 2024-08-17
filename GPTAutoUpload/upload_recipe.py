from pymongo import MongoClient
import json

def connect_to_mongo(uri, db_name):
    """Connect to MongoDB."""
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
    uri = "mongodb+srv://JakeTantorski:JakeTantorski@foodfornowrecipes.i9zgp80.mongodb.net/"  # Replace with your MongoDB URI
    db_name = "recipes_db"
    collection_name = "recipes"

    # Connect to MongoDB
    db = connect_to_mongo(uri, db_name)

    # Recipe data as JSON string or file path
    # You can use either the JSON string method or the file method.
    # Example JSON string (You can also replace this with a file path to read from a file):
    # recipe_string = '''
    #      {
    #     "name": "Braised Beef Short Ribs with Risotto Milanese",
    #     "ingredients": [ ... ],
    #     "instructions": [ ... ]
    # }

    # '''

    # Read recipe data (choose one method)
    recipe = read_recipe_from_file('recipe.json')  # Uncomment this line if using a file
    # recipe = read_recipe_from_string(recipe_string)  # Uncomment this line if using a JSON string

    # Insert the recipe into MongoDB
    inserted_id = insert_recipe(db, collection_name, recipe)
    print(f"Recipe inserted with ID: {inserted_id}")

if __name__ == "__main__":
    main()
