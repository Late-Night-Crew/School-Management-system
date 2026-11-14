# Image for the demo deployment on Render (see docs/deploy-demo.md).
# Builds the nsms binary and starts it with deploy/start.sh, which writes config.yaml
# from environment variables, migrates, loads the demo seed once and runs the server.

FROM golang:1.24-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/nsms .

FROM alpine:3.20
RUN apk add --no-cache ca-certificates \
    && adduser -D -h /app nsms
WORKDIR /app
COPY --from=build /out/nsms /app/nsms
COPY deploy/start.sh /app/start.sh
RUN chmod +x /app/start.sh && mkdir -p /app/data && chown -R nsms:nsms /app
USER nsms
EXPOSE 8080
CMD ["/app/start.sh"]
