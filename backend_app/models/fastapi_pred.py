from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
import torch
from PIL import Image
from torchvision import transforms

# Load your model
from my_model import MyModel  # replace with your class
model = MyModel()
model.load_state_dict(torch.load("output/best_model.pth", map_location="cpu"))
model.eval()

# Preprocessing function -change so it matches mine.
def preprocess(image: Image.Image):
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225])
    ])
    return transform(image).unsqueeze(0)  # batch of 1 for predicting users image

app = FastAPI()

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    image = Image.open(file.file).convert("RGB")
    input_tensor = preprocess(image)
    
    with torch.no_grad():
        output = model(input_tensor)
        predicted_class = torch.argmax(output, dim=1).item()
    
    return JSONResponse({"prediction": predicted_class})  #we give out 1 class.
