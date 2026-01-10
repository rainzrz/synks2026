#!/bin/bash

# Development Helper Scripts for Customer Portal

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Detect OS
detect_os() {
    case "$(uname -s)" in
        MINGW*|MSYS*|CYGWIN*) echo "windows" ;;
        Linux*) echo "linux" ;;
        Darwin*) echo "mac" ;;
        *) echo "unknown" ;;
    esac
}

OS=$(detect_os)

# Setup complete project
setup_project() {
    echo -e "${GREEN}Setting up Customer Portal...${NC}"
    
    # Create directory structure
    mkdir -p backend frontend/src electron/assets
    
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd backend
    
    # Use python or python3 depending on OS
    if command -v python3 &> /dev/null; then
        PYTHON_CMD="python3"
    elif command -v python &> /dev/null; then
        PYTHON_CMD="python"
    else
        echo -e "${RED}Python not found! Please install Python 3.8+${NC}"
        exit 1
    fi
    
    echo "Using: $PYTHON_CMD"
    $PYTHON_CMD -m venv venv
    
    # Activate venv based on OS
    if [ "$OS" = "windows" ]; then
        source venv/Scripts/activate
    else
        source venv/bin/activate
    fi
    
    pip install -r requirements.txt
    cd ..
    
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd frontend
    npm install
    cd ..
    
    echo -e "${YELLOW}Installing electron dependencies...${NC}"
    cd electron
    npm install
    cd ..
    
    echo -e "${GREEN}Setup complete!${NC}"
}

# Start backend only
start_backend() {
    echo -e "${GREEN}Starting Backend Server...${NC}"
    cd backend
    
    # Activate venv based on OS
    if [ "$OS" = "windows" ]; then
        source venv/Scripts/activate
    else
        source venv/bin/activate
    fi
    
    python main.py
}

# Start frontend only
start_frontend() {
    echo -e "${GREEN}Starting Frontend Server...${NC}"
    cd frontend
    npm run dev
}

# Start both backend and frontend
start_all() {
    echo -e "${GREEN}Starting Backend and Frontend...${NC}"
    
    # Start backend in background
    cd backend
    
    # Activate venv based on OS
    if [ "$OS" = "windows" ]; then
        source venv/Scripts/activate
    else
        source venv/bin/activate
    fi
    
    python main.py &
    BACKEND_PID=$!
    cd ..
    
    # Wait a bit for backend to start
    sleep 3
    
    # Start frontend
    cd frontend
    npm run dev
    
    # Cleanup on exit
    kill $BACKEND_PID 2>/dev/null
}

# Build frontend for production
build_frontend() {
    echo -e "${GREEN}Building Frontend for Production...${NC}"
    cd frontend
    npm run build
    echo -e "${GREEN}Build complete! Files in frontend/dist/${NC}"
}

# Start electron app
start_electron() {
    echo -e "${GREEN}Starting Electron App...${NC}"
    
    # Check if frontend is built
    if [ ! -d "frontend/dist" ]; then
        echo -e "${YELLOW}Frontend not built. Building now...${NC}"
        build_frontend
    fi
    
    # Start backend in background
    cd backend
    
    # Activate venv based on OS
    if [ "$OS" = "windows" ]; then
        source venv/Scripts/activate
    else
        source venv/bin/activate
    fi
    
    python main.py &
    BACKEND_PID=$!
    cd ..
    
    sleep 3
    
    # Start electron
    cd electron
    npm start
    
    # Cleanup
    kill $BACKEND_PID 2>/dev/null
}

# Test markdown parser
test_parser() {
    echo -e "${GREEN}Testing Markdown Parser...${NC}"
    cd backend
    
    # Activate venv based on OS
    if [ "$OS" = "windows" ]; then
        source venv/Scripts/activate
    else
        source venv/bin/activate
    fi
    
    python test_parser.py
}

# Clean all build artifacts
clean() {
    echo -e "${YELLOW}Cleaning build artifacts...${NC}"
    rm -rf backend/__pycache__
    rm -rf backend/*.db
    rm -rf frontend/dist
    rm -rf frontend/node_modules
    rm -rf electron/node_modules
    rm -rf electron/dist-electron
    echo -e "${GREEN}Cleaned!${NC}"
}

# Show help
show_help() {
    echo "Customer Portal - Development Scripts"
    echo ""
    echo "Usage: ./scripts.sh [command]"
    echo ""
    echo "Commands:"
    echo "  setup           - Setup complete project (install all dependencies)"
    echo "  backend         - Start backend server only"
    echo "  frontend        - Start frontend server only"
    echo "  dev             - Start both backend and frontend"
    echo "  electron        - Start Electron desktop app"
    echo "  build           - Build frontend for production"
    echo "  test            - Test markdown parser"
    echo "  clean           - Clean all build artifacts"
    echo "  help            - Show this help message"
    echo ""
}

# Main script logic
case "$1" in
    setup)
        setup_project
        ;;
    backend)
        start_backend
        ;;
    frontend)
        start_frontend
        ;;
    dev)
        start_all
        ;;
    electron)
        start_electron
        ;;
    build)
        build_frontend
        ;;
    test)
        test_parser
        ;;
    clean)
        clean
        ;;
    help|*)
        show_help
        ;;
esac