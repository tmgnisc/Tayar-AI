package com.tayarai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class TayarAiApplication {
    public static void main(String[] args) {
        SpringApplication.run(TayarAiApplication.class, args);
    }
}

