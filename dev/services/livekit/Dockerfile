# ------------------------------------------------------
# Build stage
# ------------------------------------------------------
FROM golang:1.25-alpine AS builder

WORKDIR /build
RUN apk add --no-cache git

# Clone and build LiveKit from source
RUN git clone https://github.com/livekit/livekit-server.git . && \
		go install github.com/magefile/mage@v1.17.1

RUN	mage

# should return a API Key & API Secret
# RUN ./bin/livekit-server generate-keys

# ------------------------------------------------------
# Runtime stage
# ------------------------------------------------------

FROM alpine:3.22.3

RUN apk add --no-cache ca-certificates gettext-envsubst

WORKDIR /app

RUN adduser -D livekit && \
    mkdir -p /etc/livekit && \
    chown livekit:livekit /app /etc/livekit

COPY --from=builder /build/bin/livekit-server /usr/local/bin/livekit-server

COPY --chmod=750 --chown=livekit:livekit ./conf/config.yaml /etc/livekit/config.yaml.template
COPY --chmod=750 --chown=livekit:livekit ./tools/init.sh /init.sh

USER livekit

# 7880 : http api port
# 7881 : webrtc tcp port
EXPOSE 7880 7881

ENTRYPOINT [ "/init.sh" ]

CMD ["livekit-server", "--config", "/etc/livekit/config.yaml"]
# livekit-server --config /etc/livekit/config.yaml