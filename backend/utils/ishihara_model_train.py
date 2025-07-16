# backend/utils/ishihara_model_train.py
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import models
from ishihara_preprocessing import IshiharaDataset

def train_model():
    dataset = IshiharaDataset(
        image_dir="backend/data/ishihara_cards/images",
        csv_file="backend/data/ishihara_cards/labels.csv"
    )
    dataloader = DataLoader(dataset, batch_size=16, shuffle=True)

    model = models.resnet18(weights=None)
    model.fc = nn.Linear(model.fc.in_features, 10)  # 0-9 digits

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)

    model.train()
    for epoch in range(5):  # Increase as needed
        running_loss = 0.0
        for images, labels in dataloader:
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            running_loss += loss.item()
        print(f"Epoch {epoch+1}, Loss: {running_loss:.4f}")

    # Save model
    torch.save(model.state_dict(), "backend/models/ishihara_cnn.pt")
    print("✅ Model trained and saved!")

if __name__ == "__main__":
    train_model()
