import os
import csv

image_folder = "backend/data/ishihara_cards/images"
output_csv = os.path.join("backend/data/ishihara_cards", "labels.csv")

rows = []

for filename in os.listdir(image_folder):
    if filename.endswith(".png"):
        try:
            # Example: 0_Asap-MediumItalictheme_1 type_2.png
            label = filename.split("_")[0]
            type_str = filename.split("type_")[1].replace(".png", "")
            rows.append([filename, int(label), int(type_str)])
        except Exception as e:
            print(f"Error parsing {filename}: {e}")

# Write to CSV in the parent folder of the images
with open(output_csv, mode='w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(["filename", "label", "type"])
    writer.writerows(rows)

