"""Prediction module for ML model."""

import pickle
import numpy as np
from pathlib import Path


class Predictor:
    """Class to handle model predictions."""
    
    def __init__(self, model_path=None):
        """
        Initialize the predictor.
        
        Args:
            model_path (str): Path to the trained model file
        """
        self.model = None
        self.model_path = model_path
        
        if model_path and Path(model_path).exists():
            self.load_model(model_path)
    
    def load_model(self, model_path):
        """
        Load a trained model from disk.
        
        Args:
            model_path (str): Path to the model file
        """
        try:
            with open(model_path, 'rb') as f:
                self.model = pickle.load(f)
            print(f"Model loaded successfully from {model_path}")
        except Exception as e:
            print(f"Error loading model: {e}")
            raise
    
    def save_model(self, model_path):
        """
        Save the trained model to disk.
        
        Args:
            model_path (str): Path where model should be saved
        """
        if self.model is None:
            raise ValueError("No model to save. Train a model first.")
        
        try:
            Path(model_path).parent.mkdir(parents=True, exist_ok=True)
            with open(model_path, 'wb') as f:
                pickle.dump(self.model, f)
            print(f"Model saved successfully to {model_path}")
        except Exception as e:
            print(f"Error saving model: {e}")
            raise
    
    def train(self, X_train, y_train, model=None):
        """
        Train the model.
        
        Args:
            X_train: Training features
            y_train: Training labels
            model: Model instance (if None, uses default)
        """
        if model is not None:
            self.model = model
        elif self.model is None:
            # Default to a simple model if none provided
            from sklearn.linear_model import LogisticRegression
            self.model = LogisticRegression()
        
        print("Training model...")
        self.model.fit(X_train, y_train)
        print("Training complete!")
    
    def predict(self, X):
        """
        Make predictions on input data.
        
        Args:
            X: Input features (numpy array or pandas DataFrame)
            
        Returns:
            Predictions array
        """
        if self.model is None:
            raise ValueError("No model loaded. Load or train a model first.")
        
        try:
            predictions = self.model.predict(X)
            return predictions
        except Exception as e:
            print(f"Error making predictions: {e}")
            raise
    
    def predict_proba(self, X):
        """
        Make probability predictions on input data.
        
        Args:
            X: Input features (numpy array or pandas DataFrame)
            
        Returns:
            Prediction probabilities array
        """
        if self.model is None:
            raise ValueError("No model loaded. Load or train a model first.")
        
        if not hasattr(self.model, 'predict_proba'):
            raise AttributeError("Model does not support probability predictions.")
        
        try:
            probabilities = self.model.predict_proba(X)
            return probabilities
        except Exception as e:
            print(f"Error making probability predictions: {e}")
            raise


# Standalone prediction function
def predict(model_path, input_data):
    """
    Standalone function to make predictions.
    
    Args:
        model_path (str): Path to the trained model
        input_data: Input features for prediction
        
    Returns:
        Predictions array
    """
    predictor = Predictor(model_path)
    return predictor.predict(input_data)


# Example usage
if __name__ == "__main__":
    # Example: Create sample data and demonstrate usage
    from sklearn.datasets import make_classification
    from sklearn.model_selection import train_test_split
    from sklearn.ensemble import RandomForestClassifier
    
    # Generate sample data
    X, y = make_classification(n_samples=1000, n_features=20, 
                               n_informative=15, n_redundant=5, 
                               random_state=42)
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Initialize predictor
    predictor = Predictor()
    
    # Train model
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    predictor.train(X_train, y_train, model=model)
    
    # Make predictions
    predictions = predictor.predict(X_test)
    print(f"Predictions shape: {predictions.shape}")
    print(f"Sample predictions: {predictions[:10]}")
    
    # Get probability predictions
    probabilities = predictor.predict_proba(X_test)
    print(f"Probabilities shape: {probabilities.shape}")
    print(f"Sample probabilities: {probabilities[:5]}")
    
    # Save model
    model_path = "../models/sample_model.pkl"
    predictor.save_model(model_path)
    
    # Test loading and prediction
    new_predictor = Predictor(model_path)
    new_predictions = new_predictor.predict(X_test[:5])
    print(f"Predictions from loaded model: {new_predictions}")
