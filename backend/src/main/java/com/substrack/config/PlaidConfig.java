package com.substrack.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.plaid.client.request.PlaidApi;

import java.util.HashMap;

import org.springframework.beans.factory.annotation.Value;

import com.plaid.client.ApiClient;

@Configuration
public class PlaidConfig {
    
    @Value("${plaid.client-id}")
    private String clientId;

    @Value("${plaid.secret}")
    private String secret;

    @Value("${plaid.env}")
    private String environment;
    
    @Bean
    public PlaidApi plaidApi(){
       HashMap<String, String> apiKeys = new HashMap<>();
        apiKeys.put("clientId", clientId);
        apiKeys.put("secret", secret);
        ApiClient apiClient = new ApiClient(apiKeys);
        apiClient.setPlaidAdapter(ApiClient.Sandbox);
        return apiClient.createService(PlaidApi.class);

    }


}
