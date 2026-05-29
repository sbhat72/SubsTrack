package com.substrack.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.plaid.client.request.PlaidApi;
import com.substrack.dto.PlaidResponse;
import com.substrack.model.User;
import com.substrack.service.PlaidService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/plaid")
public class PlaidController {
    private final PlaidService plaidService;

    @PostMapping("/link-token")
    public ResponseEntity<PlaidResponse> generateToken(@AuthenticationPrincipal User user) {
           return ResponseEntity.ok(plaidService.generateLinkToken(user));
    }
    
}
