import pandas as pd

print("Chargement des datasets...")

# Charger les fichiers CSV
df_train = pd.read_csv("data/fraudTrain2.csv")
df_test = pd.read_csv("data/fraudTest.csv")

print("Fusion des datasets...")

# Fusionner
df = pd.concat([df_train, df_test])

print("Suppression des doublons...")

# Supprimer doublons
df = df.drop_duplicates()

# Réinitialiser les index
df = df.reset_index(drop=True)

print("Sauvegarde du dataset final...")

# Export CSV final
df.to_csv("data/fraudTrain.csv", index=False)

print("Fusion terminée avec succès.")
print("Nombre total de lignes :", len(df))
print("Dataset sauvegardé dans : data/fraudTrain.csv")