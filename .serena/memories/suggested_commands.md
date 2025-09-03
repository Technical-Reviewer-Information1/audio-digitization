# Suggested Commands for Audio Digitization Project

## Development Commands

### Running the Application
```bash
streamlit run streamlit_app.py --server.enableCORS false --server.enableXsrfProtection false
```

### Package Management
```bash
# Install dependencies
pip3 install --user -r requirements.txt

# Install additional packages
pip3 install --user <package_name>
```

### System Commands (Linux)
- `ls` - List files and directories
- `cd` - Change directory
- `grep` - Search text patterns
- `find` - Find files
- `git` - Version control operations

### Development Workflow
1. Edit `streamlit_app.py` for main application logic
2. Update `requirements.txt` if new dependencies are added
3. Test locally with streamlit run command
4. Use git for version control