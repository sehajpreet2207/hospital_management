package com.hms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

/**
 * Main entry point for the HMS Spring Boot application.
 *
 * @SpringBootApplication is shorthand for three annotations combined:
 *   1. @Configuration        – marks this as a configuration class (can define @Bean methods)
 *   2. @EnableAutoConfiguration – lets Spring Boot auto-configure based on classpath jars
 *   3. @ComponentScan        – scans this package and all sub-packages for @Component,
 *                              @Service, @Repository, @Controller, etc.
 *
 * @EnableMongoAuditing activates the createdAt / updatedAt automatic timestamp filling.
 *   Without this, @CreatedDate and @LastModifiedDate annotations on model fields won't work.
 */
@SpringBootApplication
@EnableMongoAuditing
public class HmsApplication {

    public static void main(String[] args) {
        SpringApplication.run(HmsApplication.class, args);
    }
}
