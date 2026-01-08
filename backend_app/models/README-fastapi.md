## To run the server:

pip install fastapi uvicorn pillow torchvision torch
uvicorn server:app --host 0.0.0.0 --port 8000


## Call from a webapp (example code)
const fileInput = document.getElementById("file");
const formData = new FormData();
formData.append("file", fileInput.files[0]);

const response = await fetch("http://localhost:8000/predict", {
  method: "POST",
  body: formData
});
const data = await response.json();
console.log("Predicted class:", data.prediction);
