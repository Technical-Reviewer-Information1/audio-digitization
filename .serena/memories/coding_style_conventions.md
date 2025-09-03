# Coding Style and Conventions

## Python Style Guidelines
Since this is a Python project using Streamlit, we should follow:

### General Python Conventions
- Follow PEP 8 style guide
- Use descriptive variable and function names
- Use snake_case for variables and functions
- Use PascalCase for classes
- Keep lines under 80-100 characters when possible

### Streamlit Specific Conventions
- Use `st.` prefix for all Streamlit functions
- Organize UI components logically (title, sidebar, main content)
- Use meaningful variable names for user inputs
- Group related functionality into functions
- Use appropriate Streamlit components for data visualization

### File Organization
- Keep main logic in `streamlit_app.py`
- Import statements at the top
- Constants and configuration variables near the top
- Helper functions before main app code
- Main app execution at the bottom

### Documentation
- Add docstrings for complex functions
- Use inline comments for complex logic
- Keep README.md updated with setup and usage instructions