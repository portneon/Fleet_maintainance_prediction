# Contributing Guide

Thank you for considering contributing to the Fleet Maintenance Prediction API project!

## Ways to Contribute

- Report bugs
- Suggest new features
- Improve documentation
- Submit code improvements
- Add tests

## Getting Started

### 1. Fork the Repository

Click the "Fork" button on GitHub

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/Fleet_maintainance_prediction.git
cd Fleet_maintainance_prediction
```

### 3. Set Up Development Environment

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

## Development Guidelines

### Code Style

- Follow PEP 8 style guide
- Use type hints
- Write docstrings for all functions
- Keep functions focused and small

Format code with:
```bash
black app/
flake8 app/
```

### Testing

Add tests for new features:

```python
# tests/test_predictor.py
def test_prediction_no_failure():
    data = {
        "Air_temperature": 20.0,
        "Process_temperature": 110.0,
        "Rotational_speed": 2500,
        "Torque": 40.0,
        "Tool_wear": 50.0,
        "Type_L": False,
        "Type_M": True
    }
    result = predict_machine_failure(data)
    assert result["failure"] == 0
```

Run tests:
```bash
pytest tests/
```

### Documentation

- Update README.md for new features
- Add docstrings to all new functions
- Update API_GUIDE.md for endpoint changes

## Pull Request Process

1. **Update Documentation**: Ensure docs reflect your changes
2. **Add Tests**: Include tests for new functionality
3. **Format Code**: Run black and flake8
4. **Commit Messages**: Use clear, descriptive messages
5. **Create PR**: Submit pull request with description

### Commit Message Format

```
type(scope): brief description

Detailed explanation if needed

Fixes #issue_number
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:
```
feat(api): add batch prediction endpoint

- Allows multiple predictions in single request
- Returns array of results
- Includes validation for batch size

Fixes #123
```

## Code Review

All submissions require review before merge. Reviewers will check:

- Code quality and style
- Test coverage
- Documentation
- Performance impact

## Questions?

Open an issue or reach out to the maintainers.

---

Thank you for contributing! 🎉
