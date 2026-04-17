# train_ml.py
"""
Train a simple TF-IDF + LightGBM classifier on data/leads.csv
Outputs: model.joblib and tfidf.joblib
Assumes data/leads.csv has columns: lead_id, created_at, raw_text, label
"""

import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
import lightgbm as lgb
from scipy import sparse

# Config
DATA_FILE = "data/leads.csv"
MODEL_OUT = "model.joblib"
TFIDF_OUT = "tfidf.joblib"
RANDOM_SEED = 42

def load_data(path):
    df = pd.read_csv(path)
    # minimal checks
    if 'raw_text' not in df.columns or 'label' not in df.columns:
        raise ValueError("data/leads.csv must contain raw_text and label columns")
    df = df.fillna("")
    return df

def build_features(texts, max_features=4000):
    tfidf = TfidfVectorizer(max_features=max_features, ngram_range=(1,2), min_df=2)
    X_text = tfidf.fit_transform(texts)
    return tfidf, X_text

def train_model(X, y):
    # train/val split
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=RANDOM_SEED
    )

    clf = lgb.LGBMClassifier(
        objective='binary',
        n_estimators=1000,
        learning_rate=0.05,
        num_leaves=64,
        class_weight='balanced',
        random_state=RANDOM_SEED
    )

    clf.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        callbacks=[lgb.early_stopping(stopping_rounds=50), lgb.log_evaluation(period=50)]
    )
    return clf

def main():
    print("Loading data from", DATA_FILE)
    df = load_data(DATA_FILE)

    texts = df['raw_text'].astype(str).tolist()
    y = df['label'].astype(int).values

    print("Building TF-IDF...")
    tfidf, X_text = build_features(texts, max_features=4000)

    print("Training LightGBM...")
    model = train_model(X_text, y)

    print("Saving artifacts...")
    joblib.dump(model, MODEL_OUT)
    joblib.dump(tfidf, TFIDF_OUT)

    print("Saved:", MODEL_OUT, TFIDF_OUT)
    print("Done.")

if __name__ == "__main__":
    main()

