.PHONY: all clean clean_venv venv build docker deploy_local test

all: venv test deploy_local

clean:
	-rm -rf ./build
	-rm -rf ./src/*.egg-info
	-rm -rf ./.pytest_cache
	-find . \( -name "__pycache__" -o -name "*.pyc" -o -name "*.pyo" \) -exec rm -rf {} +
	-find ./src -empty -type d -delete

clean_venv: clean
	rm -rf ./venv

venv: 
	python3.13 -m venv ./venv/
	./venv/bin/python3 -m pip install --upgrade pip

build: clean 
	./venv/bin/python3 -m pip install -e '.[dev]'

docker: build
	docker build -t jallius/fachpraktikum-app -f DockerfileApi .
	docker build -t jallius/fachpraktikum-worker -f DockerfileWorker .
	docker build -t jallius/fachpraktikum-worker -f DockerfileFrontend .

deploy_local: docker
	docker compose down -v
	docker compose up -d  --remove-orphans

test:
	./venv/bin/python3 -m pip install -e '.[test]'
	./venv/bin/python3 -m pytest
