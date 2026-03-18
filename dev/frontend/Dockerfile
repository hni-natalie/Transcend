# -----------------------------------------
# Stage 1: Initialize React app
# -----------------------------------------

FROM node:20-alpine

# set wp working directory
WORKDIR /app

# Create Vite React app directly in container
# RUN npm create vite@latest frontend -- --template react && \
		# npm install three @react-three/fiber @react-three/drei

# Install dependencies
# RUN npm install

# For development with hot reload
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true

COPY ./tools/init.sh /init.sh
RUN chmod +x /init.sh

# NETWORKING
EXPOSE 5173

ENTRYPOINT [ "/init.sh" ]