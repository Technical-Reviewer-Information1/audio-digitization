# Audio Digitization Project Overview

## Purpose
This project is designed to create a Streamlit web application for visualizing and learning about audio digitization processes. The app will help users understand how analog audio signals are converted to digital format through sampling and quantization.

## Tech Stack
- **Language**: Python
- **Web Framework**: Streamlit
- **Dependencies**: 
  - streamlit
  - pandas
  - (Additional visualization libraries like numpy, matplotlib may be needed)

## Project Structure
- `streamlit_app.py`: Main application file (currently minimal)
- `requirements.txt`: Python dependencies
- `README.md`: Project documentation (minimal)
- `.devcontainer/`: Development container configuration for GitHub Codespaces/VS Code
- `.serena/`: Serena assistant configuration files

## Development Environment
- Python 3.11 runtime
- VS Code dev container setup
- Streamlit server runs on port 8501
- Auto-starts with `streamlit run streamlit_app.py --server.enableCORS false --server.enableXsrfProtection false`