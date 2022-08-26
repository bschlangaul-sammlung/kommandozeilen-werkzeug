build:
	npm run build

install: build
	npm install --global

tests:
	npm run test

lint:
	npm run lint

.phony: build install tests lint
