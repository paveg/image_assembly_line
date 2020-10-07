IMAGE_NAME ?= image_assembly_line/dev
NODE_VERSION ?= 12

build:
	echo "hello"

test.build_image:
	if [ -z "${REGISTRY_NAME}" ]; then \
		docker build -f Dockerfile \
			-t ${IMAGE_NAME} .; \
	else \
		DOCKER_BUILDKIT=1 docker build -f Dockerfile \
			--build-arg BUILDKIT_INLINE_CACHE=1 \
			--cache-from=${REGISTRY_NAME}/${IMAGE_NAME}:latest \
			-t ${IMAGE_NAME} .; \
	fi

dev.build_image:
	if [ -z "${REGISTRY_NAME}" ]; then \
		docker build -f dev.Dockerfile \
			--build-arg NODE_VERSION=${NODE_VERSION} \
			-t ${IMAGE_NAME} . ; \
	else \
		DOCKER_BUILDKIT=1 docker build -f dev.Dockerfile \
			--build-arg NODE_VERSION=${NODE_VERSION} \
			--build-arg BUILDKIT_INLINE_CACHE=1 \
			--cache-from=${REGISTRY_NAME}/${IMAGE_NAME}:latest \
			-t ${IMAGE_NAME} . ; \
	fi

dev.all:
	docker run --rm \
		-v ${PWD}/src:/app/src \
		-v ${PWD}/lib:/app/lib \
		-v ${PWD}/dist:/app/dist \
		-v ${PWD}/__tests__:/app/__tests__ \
		-v ${PWD}/package.json:/app/package.json \
		-v ${PWD}/package-lock.json:/app/package-lock.json \
		-t ${IMAGE_NAME}:latest \
		sh -c 'npm install && npm run all'

dev.test:
	docker run --rm \
		-v ${PWD}/src:/app/src \
		-v ${PWD}/lib:/app/lib \
		-v ${PWD}/__tests__:/app/__tests__ \
		-t ${IMAGE_NAME}:latest \
		sh -c 'npm run build && npm run test'
