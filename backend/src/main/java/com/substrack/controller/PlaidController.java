package com.substrack.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.plaid.client.request.PlaidApi;
import com.substrack.dto.ExchangeTokenRequest;
import com.substrack.dto.ExchangeTokenResponse;
import com.substrack.dto.PlaidResponse;
import com.substrack.dto.TransactionsResponse;
import com.substrack.model.PlaidConnection;
import com.substrack.model.User;
import com.substrack.service.PlaidService;
import com.plaid.client.model.Transaction;

import lombok.RequiredArgsConstructor;

import java.io.IOException;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;



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
    public ResponseEntity<ExchangeTokenResponse> exchangeToken(@RequestBody ExchangeTokenRequest request, @AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.ok(plaidService.exchangeToken(request, user));
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/detect-subscriptions")
    public ResponseEntity<List<TransactionsResponse>> detectSubscriptions(@AuthenticationPrincipal User user) {
        try {
            List<TransactionsResponse> subscriptions = plaidService.detectSubscriptions(user);
            return ResponseEntity.ok(subscriptions);
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
       
    }
    
    

    
}
