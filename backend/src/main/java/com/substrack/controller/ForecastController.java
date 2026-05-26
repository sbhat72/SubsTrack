package com.substrack.controller;

import com.substrack.dto.ForecastResponse;
import com.substrack.model.User;
import com.substrack.service.ForecastService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/forecast")
@RequiredArgsConstructor
public class ForecastController {

    private final ForecastService forecastService;

    @GetMapping
    ResponseEntity<ForecastResponse> getForecast(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(forecastService.buildForecast(user));
    }
}
