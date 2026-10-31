# Multi-stage build for SunPower Solutions Spring Boot Backend

# Stage 1: Maven Build
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder
WORKDIR /build

# Pre-fetch dependencies for layer caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and package jar
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Minimal JRE Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Install curl for healthchecks
RUN apk add --no-cache curl

# Create upload directory
RUN mkdir -p /app/uploads

# Copy packaged jar from builder
COPY --from=builder /build/target/*.jar app.jar

ENV SPRING_PROFILES_ACTIVE=prod \
    SERVER_PORT=8080

EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
