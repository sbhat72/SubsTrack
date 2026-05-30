package com.substrack.service;

import org.springframework.stereotype.Service;

import com.plaid.client.request.PlaidApi;
import com.substrack.dto.ExchangeTokenRequest;
import com.substrack.dto.ExchangeTokenResponse;
import com.substrack.dto.PlaidResponse;
import com.substrack.model.User;

import io.jsonwebtoken.lang.Arrays;
import lombok.RequiredArgsConstructor;
import com.plaid.client.model.LinkTokenCreateRequest;
import com.plaid.client.model.LinkTokenCreateResponse;
import com.plaid.client.model.LinkTokenCreateRequestUser;
import com.plaid.client.model.Products;
import com.plaid.client.model.CountryCode;
import com.plaid.client.model.ItemPublicTokenCreateRequest;
import com.plaid.client.model.ItemPublicTokenExchangeRequest;
import com.plaid.client.model.ItemPublicTokenExchangeResponse;

import retrofit2.Response;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PlaidService {
    //1. Make PlaidService Object
    //2. Validate Plaid API credentials
    //3. Implement method to generate link token for authenticated user
    private final PlaidApi plaidApi;

    public PlaidResponse generateLinkToken(User user) {
         //1. Create a LinkTokenCreateRequest object with necessary parameters
        //Use Plaid API to create a link token for the user with the given userId
        //Return the link token wrapped in a PlaidResponse DTO
        LinkTokenCreateRequestUser requestUser = new LinkTokenCreateRequestUser()
                .clientUserId(user.getId().toString());
        
        LinkTokenCreateRequest request = new LinkTokenCreateRequest()
        .user(requestUser)
        .clientName("SubsTrack")
        .products(List.of(Products.TRANSACTIONS))
        .countryCodes(List.of(CountryCode.CA))
        .language("en");

        try {
            Response<LinkTokenCreateResponse> response = plaidApi.linkTokenCreate(request).execute();
            if (response.isSuccessful() && response.body() != null) {
                LinkTokenCreateResponse body = response.body();
                return new PlaidResponse(body.getLinkToken());
            } else {
                // Handle error response from Plaid API
                throw new RuntimeException("Failed to create link token: " + response.errorBody().string());
            }
        } catch (Exception e) {
            throw new RuntimeException("Error occurred while creating link token");
        }
    }

        public ExchangeTokenResponse exchangeToken(ExchangeTokenRequest request) throws IOException{
            ItemPublicTokenExchangeRequest exchangeRequest = new ItemPublicTokenExchangeRequest()
                    .publicToken(request.getPublicToken());

            try {
                Response<ItemPublicTokenExchangeResponse> response = plaidApi.itemPublicTokenExchange(exchangeRequest).execute();

                return new ExchangeTokenResponse(
                    response.body().getAccessToken(),
                    response.body().getItemId()
                );
            }catch (Exception e) {
                throw new RuntimeException("Error occurred while exchanging public token");
            }
                
        }

}
