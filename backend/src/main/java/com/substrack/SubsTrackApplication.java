package com.substrack;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SubsTrackApplication {
    public static void main(String[] args) {
        SpringApplication.run(SubsTrackApplication.class, args);
    }
}