package com.substrack.service;

import org.springframework.stereotype.Service;

import com.plaid.client.request.PlaidApi;
import com.substrack.dto.ExchangeTokenRequest;
import com.substrack.dto.ExchangeTokenResponse;
import com.substrack.dto.PlaidResponse;
import com.substrack.dto.TransactionsResponse;
import com.substrack.model.PlaidConnection;
import com.substrack.model.Subscription;
import com.substrack.model.User;
import com.substrack.repository.PlaidConnectionRepository;

import io.jsonwebtoken.lang.Arrays;
import lombok.RequiredArgsConstructor;
import com.plaid.client.model.LinkTokenCreateRequest;
import com.plaid.client.model.LinkTokenCreateResponse;
import com.plaid.client.model.LinkTokenCreateRequestUser;
import com.plaid.client.model.Products;
import com.plaid.client.model.Transaction;
import com.plaid.client.model.TransactionsGetRequest;
import com.plaid.client.model.CountryCode;
import com.plaid.client.model.ItemPublicTokenCreateRequest;
import com.plaid.client.model.ItemPublicTokenExchangeRequest;
import com.plaid.client.model.ItemPublicTokenExchangeResponse;

import retrofit2.Response;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PlaidService {
    //1. Make PlaidService Object
    //2. Validate Plaid API credentials
    //3. Implement method to generate link token for authenticated user
    private final PlaidConnectionRepository plaidConnectionRepository;
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

        public ExchangeTokenResponse exchangeToken(ExchangeTokenRequest request, User user) throws IOException{
            ItemPublicTokenExchangeRequest exchangeRequest = new ItemPublicTokenExchangeRequest()
                    .publicToken(request.getPublicToken());

            try {
                Response<ItemPublicTokenExchangeResponse> response = plaidApi.itemPublicTokenExchange(exchangeRequest).execute();
                String accessToken = response.body().getAccessToken();
                String itemId = response.body().getItemId();
                PlaidConnection connection = PlaidConnection.builder()
                        .user(user)
                        .accessToken(accessToken)
                        .itemId(itemId)
                        .build();
                plaidConnectionRepository.save(connection);
                
                return new ExchangeTokenResponse(
                    accessToken,
                    itemId
                );
            }catch (Exception e) {
                throw new RuntimeException("Error occurred while exchanging public token");
            }
                
        }

        public List<Transaction> fetchTransactions(PlaidConnection connection) throws IOException{
            TransactionsGetRequest request = new TransactionsGetRequest()
                    .accessToken(connection.getAccessToken())
                    .startDate(LocalDate.now().minusMonths(12))
                    .endDate(LocalDate.now());
            try{
                List<Transaction> transactions = plaidApi.transactionsGet(request).execute().body().getTransactions();
                return transactions;
            }catch(Exception e){
                throw new RuntimeException("Error occurred while fetching transactions");
            }
        }

        public List<List<Subscription>> detectSubscriptions(List<Transaction> transactions){
            //1. Analyze the transaction data to identify recurring transactions that likely represent subscriptions
            //2. Group transactions by name and amount to identify potential subscriptions
            //3. Determine the billing cycle (e.g., monthly, yearly) based on the frequency of transactions
            //4. Create a list of Subscription objects with the identified subscription details
            //5. Return the list of detected subscriptions

            
            return null;
        }

}
