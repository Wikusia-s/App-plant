"""
Plant recommendation module (production version).

- Ładuje artykuły o roślinach z JSON-a.
- Buduje macierz TF-IDF (z Porter stemmerem).
- Wyciąga cechy (light / water / humidity / toxicity / difficulty) z tekstu.
- Dostarcza trzy główne metody:
    * similar_plants(...)
    * recommend_by_constraints(...)
    * hybrid_recommend(...)
"""

import json
import re
from dataclasses import dataclass
from typing import List, Dict, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# --- NLTK preprocessing ---
import nltk
from nltk.stem import PorterStemmer
from nltk.tokenize import word_tokenize

# Upewniamy się, że wymagane zasoby NLTK są dostępne (później pomyślej jak włączyć to w apkę)
_NLTK_RESOURCES = [
    ("tokenizers/punkt", "punkt"),
]

def ensure_nltk_resources():
    resources = [("tokenizers/punkt", "punkt")]
    for path, pkg in resources:
        try:
            nltk.data.find(path)
        except LookupError:
            nltk.download(pkg)

# ======================================================================
# 1. Ustawienia przetwarzania tekstu – PROD: Porter stemmer
# ======================================================================

PROCESSING_OPTS = {
    "use_stemmer": "porter",  # w produkcji zawsze Porter, do stestów mamy inne opcje
    "lowercase": True,
    "min_df": 1,
    "max_df": 0.95,
    "ngram_range": (1, 2),
    "stop_words": "english",
}


def get_stemmer():
    if PROCESSING_OPTS["use_stemmer"] == "porter":
        return PorterStemmer()
    else:
        return None


def preprocess_text(doc: str) -> str:
    """Podstawowe przetwarzanie tekstu: lower, tokenizacja, stemming (Porter)."""
    if not isinstance(doc, str):
        return ""
    txt = doc.lower() if PROCESSING_OPTS["lowercase"] else doc
    tokens = word_tokenize(txt)
    stemmer = get_stemmer()
    processed = []
    for t in tokens:
        if not t.isalpha():
            continue
        w = t
        if stemmer:
            w = stemmer.stem(w)
        processed.append(w)
    return " ".join(processed)


# ======================================================================
# 2. Ładowanie danych
# ======================================================================

def load_and_aggregate_json(path: str) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Ładuje JSON z artykułami o roślinach i agreguje treść po plant_name.
    Zwraca:
        df_raw: wiersz = artykuł
        df_agg: wiersz = roślina, kolumny: plant_name, content
    """
    with open(path, "r", encoding="utf-8") as f:
        js = json.load(f)
    df_raw = pd.DataFrame(js)
    if "plant_name" not in df_raw.columns or "content" not in df_raw.columns:
        raise ValueError("Brak wymaganych kolumn 'plant_name' i 'content'")
    df_agg = (
        df_raw.groupby("plant_name", as_index=False)
        .agg({"content": lambda s: "\n".join([x for x in s if isinstance(x, str)])})
    )
    return df_raw, df_agg


# ======================================================================
# 3. TF-IDF i podobieństwo tekstowe
# ======================================================================

def build_tfidf_matrix(df_agg: pd.DataFrame):
    """
    Buduje tf-idf dla kolumny 'content'.
    Zwraca:
        vectorizer, matrix (scipy sparse), plant_names (lista nazw roślin)
    """
    vectorizer = TfidfVectorizer(
        preprocessor=preprocess_text,
        tokenizer=None,
        lowercase=False,
        min_df=PROCESSING_OPTS["min_df"],
        max_df=PROCESSING_OPTS["max_df"],
        ngram_range=PROCESSING_OPTS["ngram_range"],
        stop_words=PROCESSING_OPTS["stop_words"],
    )
    matrix = vectorizer.fit_transform(df_agg["content"].fillna(""))
    plant_names = df_agg["plant_name"].tolist()
    return vectorizer, matrix, plant_names


def get_centroid_vector(seed_plants: List[str], matrix, plant_names: List[str]):
    """
    Liczy centroid wektorów tf-idf dla listy roślin seedowych --> czyli te które użytkownik będzie miał w kolekcji
    Narazxie wpisujemy je z łapki ale później będzie potrzebne połączenie ze strukturą koll;ekcji reoślin użytkownika.
    """
    name_to_idx = {n.lower(): i for i, n in enumerate(plant_names)}
    idx = []
    for p in seed_plants:
        key = p.strip().lower()
        if not key:
            continue
        match = name_to_idx.get(key)
        if match is not None:
            idx.append(match)
    if not idx:
        raise ValueError("Brak znanych roślin w listy seedów.")
    sub = matrix[idx]
    centroid = sub.sum(axis=0) / len(idx)
    centroid = np.asarray(centroid)
    if centroid.ndim == 1:
        centroid = centroid[None, :]
    return centroid


def get_similar_plants(
    seed_plants: List[str],
    matrix,
    plant_names: List[str],
    top_k: int = 10,
    exclude_seeds: bool = True,
) -> List[Tuple[str, float]]:
    """
    Zwraca listę (plant_name, similarity) najbardziej podobnych roślin.
    """
    centroid = get_centroid_vector(seed_plants, matrix, plant_names)
    sims = cosine_similarity(centroid, matrix)[0]
    order = np.argsort(-sims)
    exclude = set(seed_plants) if exclude_seeds else set()
    results: List[Tuple[str, float]] = []
    for i in order:
        name = plant_names[i]
        if name in exclude:
            continue
        results.append((name, float(sims[i])))
        if len(results) >= top_k:
            break
    return results


# ======================================================================
# 4. Wyciąganie cech z tekstu (light/water/humidity/toxicity/difficulty)
# ======================================================================

LIGHT_MAP = {
    r"low light|very low light|shade|shady|little light|no direct": "low",
    r"partial shade|dappled shade|indirect light|bright( but)? indirect light|"
    r"filtered light|east(-|\s)?facing|north(-|\s)?facing": "medium",
    r"bright direct( sunlight)?|full sun|south(-|\s)?facing|"
    r"at least (4|5|6)\+?\s*hours of sun": "high",
}

WATER_MAP = {
    r"succulent|cactus|let (the )?soil (completely )?dry|drought tolerant|"
    r"tolerates drought|infrequent watering|water sparingly": "low",
    r"moderate watering|allow top( few)? inch(es)? to dry|weekly watering|"
    r"when the top (inch|layer) feels dry": "medium",
    r"keep (soil|substrate) (evenly )?moist|constantly moist|frequent watering|"
    r"do not let (the )?soil dry out": "high",
}

HUMIDITY_MAP = {
    r"tolerates dry air|low humidity|radiator|central heating": "low",
    r"average humidity|normal household humidity|room humidity": "medium",
    r"high humidity|humid environment|bathroom plant|terrarium|"
    r"misting|frequent misting|use a humidifier": "high",
}

# UWAGA: safe przed toxic, żeby nie złapać 'toxic' w 'non-toxic'.
TOXIC_MAP = {
    r"non[-\s]?toxic|not toxic|pet[-\s]?safe|safe for (cats|dogs|pets)|nontoxic": "safe",
    r"\btoxic\b|\bpoisonous\b|keep away from pets|irritant|calcium oxalate|"
    r"causes (irritation|upset stomach|vomiting)": "toxic",
}

DIFFICULTY_MAP = {
    r"very easy|super easy|beginner[-\s]?friendly|for beginners|"
    r"low[-\s]?maintenance|hardy|tolerant|for busy people": "easy",
    r"intermediate|moderate care|required care|some experience": "medium",
    r"advanced|tricky|challenging|demanding|requires attention": "hard",
}


def extract_trait(text: str, mapping: Dict[str, str], default=None):
    t = (text or "").lower()
    for pattern, value in mapping.items():
        if re.search(pattern, t):
            return value
    return default


def parse_traits_from_text(text: str) -> Dict[str, Optional[str]]:
    return {
        "light": extract_trait(text, LIGHT_MAP),
        "water": extract_trait(text, WATER_MAP),
        "humidity": extract_trait(text, HUMIDITY_MAP),
        "toxicity": extract_trait(text, TOXIC_MAP),
        "difficulty": extract_trait(text, DIFFICULTY_MAP),
    }


def _majority_or_first(s: pd.Series):
    s = s.dropna()
    if s.empty:
        return None
    counts = s.value_counts()
    return counts.index[0]


def build_traits_table(df_raw: pd.DataFrame) -> pd.DataFrame:
    """
    Wyciąga cechy z poszczególnych artykułów, a następnie robi majority vote
    po plant_name (jedna linia na roślinę).
    """
    rows = []
    for _, row in df_raw.iterrows():
        pn, ct = row.get("plant_name"), row.get("content")
        if isinstance(pn, str) and isinstance(ct, str):
            traits = parse_traits_from_text(ct)
            rows.append({"plant_name": pn, **traits})
    df_traits = pd.DataFrame(rows)
    df_traits = (
        df_traits
        .groupby("plant_name", as_index=False)
        .agg(_majority_or_first)
    )
    return df_traits


# ======================================================================
# 5. Rekomendacje z ograniczeniami użytkownika
# ======================================================================

@dataclass
class UserConstraints:
    light: Optional[str] = None
    water: Optional[str] = None
    humidity: Optional[str] = None
    pets_safe: Optional[bool] = None
    difficulty: Optional[str] = None


WEIGHTS = {"light": 2.0, "water": 1.5, "humidity": 1.0, "difficulty": 0.5}


def score_constraints(plant_name: str, df_traits: pd.DataFrame, constraints: UserConstraints) -> float:
    row = df_traits[df_traits["plant_name"] == plant_name]
    if row.empty:
        return 0.0
    r = row.iloc[0].to_dict()

    # twardy filtr bezpieczeństwa dla zwierząt
    if constraints.pets_safe and r.get("toxicity") == "toxic":
        return -1e9

    score = 0.0
    if constraints.light and r.get("light") == constraints.light:
        score += WEIGHTS["light"]
    if constraints.water and r.get("water") == constraints.water:
        score += WEIGHTS["water"]
    if constraints.humidity and r.get("humidity") == constraints.humidity:
        score += WEIGHTS["humidity"]
    if constraints.difficulty and r.get("difficulty") == constraints.difficulty:
        score += WEIGHTS["difficulty"]
    return score


def recommend_by_constraints(
    df_agg: pd.DataFrame,
    df_traits: pd.DataFrame,
    constraints: UserConstraints,
    top_k: int = 10,
) -> List[Tuple[str, float]]:
    """
    Rekomenduje rośliny wyłącznie na podstawie cech i ograniczeń użytkownika.
    Zwraca listę (plant_name, score).
    """
    names = df_agg["plant_name"].tolist()
    scores = [(n, score_constraints(n, df_traits, constraints)) for n in names]
    # odrzucamy rośliny z -1e9 (niebezpieczne dla zwierząt przy pets_safe=True)
    scores = [x for x in scores if x[1] > -1e8]
    scores.sort(key=lambda x: x[1], reverse=True)
    return scores[:top_k]


def hybrid_recommend(
    seed_plants: List[str],
    matrix,
    plant_names: List[str],
    df_agg: pd.DataFrame,
    df_traits: pd.DataFrame,
    constraints: Optional[UserConstraints] = None,
    alpha: float = 0.6,
    top_k: int = 10,
) -> List[Tuple[str, float]]:
    """
    Hybryda: łączy podobieństwo tekstowe z dopasowaniem do warunków użytkownika.
    alpha ~ waga podobieństwa tekstowego (0–1).
    """
    sims = get_similar_plants(seed_plants, matrix, plant_names, top_k=len(df_agg), exclude_seeds=True)
    if not constraints:
        return sims[:top_k]

    denom = sum(WEIGHTS.values())
    rescored: List[Tuple[str, float]] = []
    for name, sim in sims:
        cscore = score_constraints(name, df_traits, constraints)
        if cscore <= -1e8:
            continue
        final = alpha * sim + (1 - alpha) * (cscore / denom)
        rescored.append((name, float(final)))
    rescored.sort(key=lambda x: x[1], reverse=True)
    return rescored[:top_k]


# ======================================================================
# 6. Klasa wysokopoziomowa do łatwego użycia w aplikacji
# ======================================================================

class PlantRecommender: #Wysokopoziomowy wrapper, żeby w apce nie bawić się w DF-y ręcznie.
    def __init__(
        self,
        df_raw: pd.DataFrame,
        df_agg: pd.DataFrame,
        df_traits: pd.DataFrame,
        vectorizer,
        matrix,
        plant_names: List[str],
    ):
        self.df_raw = df_raw
        self.df_agg = df_agg
        self.df_traits = df_traits
        self.vectorizer = vectorizer
        self.matrix = matrix
        self.plant_names = plant_names

    @classmethod
    def from_json(cls, json_path: str) -> "PlantRecommender": #Główna metoda inicjalizacji: ładuje JSON, buduje tf-idf + cechy.
        df_raw, df_agg = load_and_aggregate_json(json_path)
        df_traits = build_traits_table(df_raw)
        vectorizer, matrix, plant_names = build_tfidf_matrix(df_agg)
        return cls(df_raw, df_agg, df_traits, vectorizer, matrix, plant_names)

    # --- API do wykorzystania w aplikacji ---
    def similar_plants(self, seed_plants: List[str], top_k: int = 10) -> List[Tuple[str, float]]:
        return get_similar_plants(seed_plants, self.matrix, self.plant_names, top_k=top_k)

    def recommend_by_constraints(self, constraints: UserConstraints, top_k: int = 10) -> List[Tuple[str, float]]:
        return recommend_by_constraints(self.df_agg, self.df_traits, constraints, top_k=top_k)

    def hybrid_recommend(
        self,
        seed_plants: List[str],
        constraints: Optional[UserConstraints] = None,
        alpha: float = 0.6,
        top_k: int = 10,
    ) -> List[Tuple[str, float]]:
        return hybrid_recommend(
            seed_plants,
            self.matrix,
            self.plant_names,
            self.df_agg,
            self.df_traits,
            constraints,
            alpha,
            top_k,
        )
