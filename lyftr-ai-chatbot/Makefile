.PHONY: up down restart test logs clean build

# Start services using Docker Compose in detached mode
up:
	docker compose up --build -d

# Stop and remove all containers, networks
down:
	docker compose down

# View logs for both backend and frontend
logs:
	docker compose logs -f

# Restart all containers
restart:
	docker compose down && docker compose up --build -d

# Run automated backend test suite
test:
	python -m pytest backend/tests/test_chat.py -v

# Clean temporary Python and cache files
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf backend/.pytest_cache
