IMAGE_NAME ?= image_assembly_line/dev
NODE_VERSION ?= 12
DOCKER_VERSION ?= 18.09.9

build:
	echo "hello"

build_dev_image:
	docker build -f dev.Dockerfile \
		--build-arg NODE_VERSION=${NODE_VERSION} \
		--build-arg DOCKER_VERSION=${DOCKER_VERSION} \
		-t ${IMAGE_NAME} .

run_all:
	docker run --rm \
		-v ${PWD}/src:/app/src \
		-v ${PWD}/lib:/app/lib \
		-v ${PWD}/dist:/app/dist \
		-v ${PWD}/__tests__:/app/__tests__ \
		-t ${IMAGE_NAME}:latest \
		sh -c 'npm run all'

build_test:
	docker run --rm \
		-v ${PWD}/src:/app/src \
		-v ${PWD}/lib:/app/lib \
		-v ${PWD}/__tests__:/app/__tests__ \
		-t ${IMAGE_NAME}:latest \
		sh -c 'npm run build && npm run test'
