package com.substrack.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.plaid.client.request.PlaidApi;
import com.substrack.dto.ExchangeTokenRequest;
import com.substrack.dto.ExchangeTokenResponse;
import com.substrack.dto.PlaidResponse;
import com.substrack.model.User;
import com.substrack.service.PlaidService;

import lombok.RequiredArgsConstructor;

import java.io.IOException;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RequiredArgsConstructor
@RestController
@RequestMapping("/api/plaid")
public class PlaidController {
    private final PlaidService plaidService;

    @PostMapping("/link-token")
    public ResponseEntity<PlaidResponse> generateToken(@AuthenticationPrincipal User user) {
           return ResponseEntity.ok(plaidService.generateLinkToken(user));
    }

    @PostMapping("/exchange-token")
    public ResponseEntity<ExchangeTokenResponse> exchangeToken(@RequestBody ExchangeTokenRequest request) {
        try {
            return ResponseEntity.ok(plaidService.exchangeToken(request));
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
    

    
}
