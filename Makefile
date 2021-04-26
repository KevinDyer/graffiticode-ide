default:
	npm start

test: build
	npm run test

build:
	npm run build

heroku:
	git push heroku deploy-main:main
