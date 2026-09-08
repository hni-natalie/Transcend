FROM alpine:3.22.3

RUN apk add --no-cache openssl
RUN adduser -D -u 1001 appuser

RUN mkdir -p /etc/certs
RUN chown appuser:appuser /etc/certs

COPY ./generate_certs.sh /generate_certs.sh
RUN chmod +x /generate_certs.sh

# Run as non-root user
USER appuser

ENTRYPOINT ["/generate_certs.sh"]