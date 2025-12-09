# recommender_service.py
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

# Używamy lokalnego modułu rekomendera (plik recommender_for_app.py)
from recommender_for_app import (
    ensure_nltk_resources,
    PlantRecommender,
    UserConstraints,
)

app = FastAPI()


# Prosty healthcheck do sond w backendzie Node
@app.get("/health")
def health():
    return {"status": "ok"}

# 1. Przy starcie serwisu ogarniamy NLTK + ładujemy model/rekomender
ensure_nltk_resources()

# Ścieżka do danych — użyjemy pliku z backend_app/data/plant_articles.json
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DEFAULT_DATA = os.path.join(ROOT_DIR, "backend_app", "data", "plant_articles.json")
DATA_PATH = os.getenv("PLANT_DATA_PATH", DEFAULT_DATA)

RECOMMENDER = PlantRecommender.from_json(DATA_PATH)


# ---------- MODELE REQUESTÓW/RESPONSÓW ----------

class SimilarRequest(BaseModel):
    seed_plants: List[str]
    top_k: int = 10 #tutaj to top k możemy też w sumie dać jako user input później w apce, ale no niech zostanie bazowo 10 np (wtedy ważne że jak będzie okienko w apce to żeby się pokazywało 10 i user może to zmienić)


class ConstraintsRequest(BaseModel):
    #wszystkie constrainty będą definiowane przez usera w apce
    light: Optional[str] = None
    water: Optional[str] = None
    humidity: Optional[str] = None
    pets_safe: Optional[bool] = None
    difficulty: Optional[str] = None
    top_k: int = 10 #tutaj to top k możemy też w sumie dać jako user input później w apce, ale no niech zostanie bazowo 10 np (wtedy ważne że jak będzie okienko w apce to żeby się pokazywało 10 i user może to zmienić)

#tutaj ten nasz seed to będą wszystkie rośliny które użytkownik będzie miał w kolekcji
class HybridRequest(ConstraintsRequest):
    seed_plants: List[str]


# ---------- ENDPOINTY ----------
#i tutaj z tych endpointów dajemy opcje żeby user mógł wybrać, tzn. docelowo będzie 
# hubrydowo, ale będzie jakiś ukryty switch w apce (taki coś w stylu advanced options) 
# i np może odticknąć "przy rekomendacji weż pod uwagę  rośliny w mojej kolekcji" --> wtedy wywołujemy tylko similar_plants - 1. funcja
# "przy rekomendacji weź pod uwagę moje założenia'" --> wtedy wywołujemy recommend_by_constraints - 2. funcja
#no i jak 2 będą tyknięte - tak jak mamy docelowo - hybrid_recommend - 3. funcja

@app.post("/recommend/similar")
def recommend_similar(req: SimilarRequest):
    try:
        results = RECOMMENDER.similar_plants(
            seed_plants=req.seed_plants,
            top_k=req.top_k,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # fallback to 500 but with a clear message
        raise HTTPException(status_code=500, detail=f"similar failed: {e}")

    return [
        {"plant_name": name, "score": score}
        for name, score in results
    ]


#dalej w krokach mamy opcje z constraiuntam,i - je user będzie sam podawał

@app.post("/recommend/constraints")
def recommend_constraints(req: ConstraintsRequest):
    constraints = UserConstraints(
        light=req.light,
        water=req.water,
        humidity=req.humidity,
        pets_safe=req.pets_safe,
        difficulty=req.difficulty,
    )
    results = RECOMMENDER.recommend_by_constraints(
        constraints=constraints,
        top_k=req.top_k,
    )
    return [
        {"plant_name": name, "score": score}
        for name, score in results
    ]


@app.post("/recommend/hybrid")
def recommend_hybrid(req: HybridRequest):
    constraints = UserConstraints(
        light=req.light,
        water=req.water,
        humidity=req.humidity,
        pets_safe=req.pets_safe,
        difficulty=req.difficulty,
    )
    try:
        results = RECOMMENDER.hybrid_recommend(
            seed_plants=req.seed_plants,
            constraints=constraints,
            top_k=req.top_k,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"hybrid failed: {e}")

    return [
        {"plant_name": name, "score": score}
        for name, score in results
    ]
