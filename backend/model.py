import os
import warnings

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
warnings.filterwarnings(
	"ignore",
	message="TensorFlow GPU support is not available on native Windows for TensorFlow >= 2.11.*",
)

import pandas as pd
from math import sqrt
from sklearn.metrics import (
	accuracy_score,
	classification_report,
	confusion_matrix,
	f1_score,
	mean_absolute_error,
	mean_squared_error,
	precision_score,
	recall_score,
	r2_score,
)
from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.svm import SVC
from tensorflow.keras.layers import Dense, Input
from tensorflow.keras.models import Sequential
import tensorflow as tf

tf.get_logger().setLevel("ERROR")

data = pd.read_csv("dataset.csv")

# Handle missing values.
data = data.dropna()

# Encode categorical columns.
categorical_columns = data.select_dtypes(include=["object"]).columns
encoder = LabelEncoder()

for column in categorical_columns:
	data[column] = encoder.fit_transform(data[column])

# Separate features and target.
target_column = "Total Score"
X = data.drop(columns=[target_column])
y = (data[target_column] >= data[target_column].median()).astype(int)

# Feature scaling.
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(
	X_scaled,
	y,
	test_size=0.2,
	random_state=42,
)

knn_model = KNeighborsClassifier(n_neighbors=5)
svm_model = SVC()

ann_model = Sequential()
ann_model.add(Input(shape=(X_train.shape[1],)))
ann_model.add(Dense(10, activation="relu"))
ann_model.add(Dense(5, activation="relu"))
ann_model.add(Dense(1, activation="sigmoid"))

ann_model.compile(
	optimizer="adam",
	loss="binary_crossentropy",
	metrics=["accuracy"],
)


def evaluate_model(name, model, features_train, features_test, target_train, target_test):
	model.fit(features_train, target_train)
	predictions = model.predict(features_test)
	print(f"\n{name} results:")
	print(f"MAE: {mean_absolute_error(target_test, predictions):.4f}")
	print(f"MSE: {mean_squared_error(target_test, predictions):.4f}")
	print(f"RMSE: {sqrt(mean_squared_error(target_test, predictions)):.4f}")
	print(f"R2: {r2_score(target_test, predictions):.4f}")
	print(f"Accuracy: {accuracy_score(target_test, predictions):.4f}")
	print(f"Precision: {precision_score(target_test, predictions, zero_division=0):.4f}")
	print(f"Recall: {recall_score(target_test, predictions, zero_division=0):.4f}")
	print(f"F1-score: {f1_score(target_test, predictions, zero_division=0):.4f}")
	print("Confusion Matrix:")
	print(confusion_matrix(target_test, predictions))
	print("Classification Report:")
	print(classification_report(target_test, predictions, zero_division=0))
	return {
		"Algorithm": name,
		"Accuracy": accuracy_score(target_test, predictions),
		"Precision": precision_score(target_test, predictions, zero_division=0),
		"Recall": recall_score(target_test, predictions, zero_division=0),
		"F1-score": f1_score(target_test, predictions, zero_division=0),
	}


print("Preprocessed features:")
print(pd.DataFrame(X_scaled, columns=X.columns).head())
print("\nTarget preview:")
print(y.head())
print("\nTrain/Test split shapes:")
print(X_train.shape, X_test.shape, y_train.shape, y_test.shape)

results = []

results.append(evaluate_model("KNN", knn_model, X_train, X_test, y_train, y_test))
results.append(evaluate_model("SVM", svm_model, X_train, X_test, y_train, y_test))

ann_model.fit(X_train, y_train, epochs=20, verbose=0)
ann_pred = ann_model.predict(X_test, verbose=0)
ann_pred = (ann_pred.reshape(-1) >= 0.5).astype(int)

print("\nANN results:")
print(f"MAE: {mean_absolute_error(y_test, ann_pred):.4f}")
print(f"MSE: {mean_squared_error(y_test, ann_pred):.4f}")
print(f"RMSE: {sqrt(mean_squared_error(y_test, ann_pred)):.4f}")
print(f"R2: {r2_score(y_test, ann_pred):.4f}")
print(f"Accuracy: {accuracy_score(y_test, ann_pred):.4f}")
print(f"Precision: {precision_score(y_test, ann_pred, zero_division=0):.4f}")
print(f"Recall: {recall_score(y_test, ann_pred, zero_division=0):.4f}")
print(f"F1-score: {f1_score(y_test, ann_pred, zero_division=0):.4f}")
print("Confusion Matrix:")
print(confusion_matrix(y_test, ann_pred))
print("Classification Report:")
print(classification_report(y_test, ann_pred, zero_division=0))

results.append(
	{
		"Algorithm": "ANN",
		"Accuracy": accuracy_score(y_test, ann_pred),
		"Precision": precision_score(y_test, ann_pred, zero_division=0),
		"Recall": recall_score(y_test, ann_pred, zero_division=0),
		"F1-score": f1_score(y_test, ann_pred, zero_division=0),
	}
)

results_table = pd.DataFrame(results)
print("\nResults Comparison:")
print(results_table.to_string(index=False, formatters={"Accuracy": "{:.2%}".format, "Precision": "{:.2%}".format, "Recall": "{:.2%}".format, "F1-score": "{:.2%}".format}))

best_model = results_table.sort_values(by="Accuracy", ascending=False).iloc[0]
print(f"\nBest model: {best_model['Algorithm']}")
print("Why it may have performed better: it captured the binary decision boundary more effectively on this scaled dataset.")
