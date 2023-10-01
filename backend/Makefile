SHELL := /bin/bash

build: $(shell find src -type f)
	yarn install
	yarn build

clean:
	rm -rf ./dist

up:
	docker-compose up -d
	make build
	yarn start

test: up
	yarn test