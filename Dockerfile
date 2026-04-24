# Stage 1: Build the application
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /app
# Copy the pom.xml and source code
COPY pom.xml .
COPY src ./src
# Build the application, skipping tests to speed up deployment
RUN mvn clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:17-jdk
WORKDIR /app
# Copy the generated JAR file from the builder stage
COPY --from=builder /app/target/*.jar app.jar
# Expose the dynamic port provided by Render
EXPOSE ${PORT}
# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
