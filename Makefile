build:
	npm run build

install: build
	sudo rm -f /usr/local/bin/bschlangaul-werkzeug.js
	sudo chmod a+x dist/main.js
	sudo ln -s $(pwd)/dist/main.js /usr/local/bin/bschlangaul-werkzeug.js

install_global: build
	npm install --global

tests:
	npm run test

lint:
	npm run lint

.phony: build install tests lint
