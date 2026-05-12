import pickle
import pandas as pd

# -----------------------------
# 1. Categorization
# -----------------------------
def categorize(score):
    if score <= 4:
        return "Low"
    elif score <= 7:
        return "Medium"
    else:
        return "High"


# -----------------------------
# 2. Load Model (once)
# -----------------------------
with open(r"C:\Users\meena\Downloads\addiction_dual_model.pkl", "rb") as f:
    bundle = pickle.load(f)

model = bundle["model"]


# -----------------------------
# 3. QUESTION → FEATURE MAPPING
# -----------------------------
def process_user_answers(answers):
    """
    Convert UI answers into model input format
    """

    user_data = {
        "Age": answers["age"],
        "Gender": answers["gender"],
        "Country": answers["country"],
        "Academic_Level": answers["academic_level"],
        "Most_Used_Platform": answers["platform"],
        "Avg_Daily_Usage_Hours": answers["usage_hours"],
        "Affects_Academic_Performance": answers["academic_impact"]
    }

    return user_data


# -----------------------------
# 4. PREDICTION FUNCTION
# -----------------------------
def predict_addiction(answers):

    # Step 1: Convert answers → dataframe
    user_data = process_user_answers(answers)
    X_new = pd.DataFrame([user_data])

    # Step 2: Encode
    X_new_encoded = pd.get_dummies(X_new)

    # Step 3: Align with training columns
    X_new_encoded = X_new_encoded.reindex(
        columns=model.feature_names_in_,
        fill_value=0
    )

    # Step 4: Predict
    score = model.predict(X_new_encoded)[0]

    # Step 5: Categorize
    level = categorize(score)

    # Step 6: Analysis
    insights = generate_insights(answers, score, level)

    return {
        "score": round(float(score), 2),
        "level": level,
        "insights": insights
    }


# -----------------------------
# 5. ANALYSIS ENGINE 🔥
# -----------------------------
def generate_insights(answers, score, level):

    insights = []

    # Usage-based insight
    if answers["usage_hours"] > 6:
        insights.append("High daily screen time detected. This may impact focus and productivity.")

    # Academic impact
    if answers["academic_impact"] == "Yes":
        insights.append("Your usage is affecting academic performance. Consider reducing distractions.")

    # Platform-based
    if answers["platform"] in ["Instagram", "TikTok"]:
        insights.append("High engagement platform usage detected (possible scrolling habit).")

    # Risk-based suggestions
    if level == "High":
        insights.append("⚠️ High addiction risk. Reduce usage gradually and introduce offline activities.")
    elif level == "Medium":
        insights.append("⚡ Moderate usage. Try setting daily limits.")
    else:
        insights.append("✅ Healthy usage pattern. Keep it balanced.")

    return insights


# -----------------------------
# 6. TEST RUN (simulate UI)
# -----------------------------
if __name__ == "__main__":

    # Simulated UI answers
    user_answers = {
        "age": 21,
        "gender": "Male",
        "country": "India",
        "academic_level": "Undergraduate",
        "platform": "Instagram",
        "usage_hours": 6,
        "academic_impact": "Yes"
    }

    result = predict_addiction(user_answers)

    print("\n===== RESULT =====")
    print("Score:", result["score"])
    print("Level:", result["level"])
    print("Insights:")
    for i in result["insights"]:
        print("-", i)