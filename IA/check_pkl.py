import pickle
with open("encodings.pkl", "rb") as f:
    data = pickle.load(f)
print("Nombre encodages:", len(data["encodings"]))
print("Noms:", list(set(data["names"])))
