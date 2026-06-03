package com.substrack.service;

import org.springframework.stereotype.Service;

import com.plaid.client.request.PlaidApi;
import com.substrack.dto.ExchangeTokenRequest;
import com.substrack.dto.ExchangeTokenResponse;
import com.substrack.dto.PlaidResponse;
import com.substrack.dto.TransactionsResponse;
import com.substrack.model.BillingCycle;
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
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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

       public List<TransactionsResponse> detectSubscriptions(User user) throws IOException {


        List<PlaidConnection> connections = plaidConnectionRepository.findByUser_Id(user.getId());
        if (connections.isEmpty()) {
            throw new RuntimeException("No bank connected for this user");
        }
        List<Transaction> transactions = fetchTransactions(connections.get(0));
        if(transactions.isEmpty()) throw new RuntimeException("No transactions found for the user");
        List<TransactionsResponse> detectedSubscriptions = new ArrayList<>();

        Map<String, List<Transaction>> groupedTransactions = transactions.stream()
                .collect(Collectors.groupingBy(t ->
                    t.getMerchantName() != null ? t.getMerchantName() : t.getName()
                ));

        for (Map.Entry<String, List<Transaction>> entry : groupedTransactions.entrySet()) {
            String merchantName = entry.getKey();
            List<Transaction> merchantTransactions = entry.getValue();

            if (merchantTransactions.size() < 2) continue;

            merchantTransactions.sort((t1, t2) -> t1.getDate().compareTo(t2.getDate()));

            BillingCycle billingCycle = null;

            for (int i = 1; i < merchantTransactions.size(); i++) {
                LocalDate previousDate = merchantTransactions.get(i - 1).getDate();
                LocalDate currentDate = merchantTransactions.get(i).getDate();
                int gap = (int) ChronoUnit.DAYS.between(previousDate, currentDate);

                if (gap >= 27 && gap <= 33) {
                    billingCycle = BillingCycle.MONTHLY;
                } else if (gap >= 350 && gap <= 370) {
                    billingCycle = BillingCycle.YEARLY;
                } else if (gap >= 6 && gap <= 8) {
                    billingCycle = BillingCycle.WEEKLY;
                } else if (gap >= 13 && gap <= 15) {
                    billingCycle = BillingCycle.BIWEEKLY;
                }
            }

            if (billingCycle == null) continue;

            LocalDate lastChargeDate = merchantTransactions
                    .get(merchantTransactions.size() - 1).getDate();

            LocalDate nextBillingDate = switch (billingCycle) {
                case MONTHLY -> lastChargeDate.plusMonths(1);
                case YEARLY -> lastChargeDate.plusYears(1);
                case WEEKLY -> lastChargeDate.plusWeeks(1);
                case BIWEEKLY -> lastChargeDate.plusDays(14);
            };

            BigDecimal amount = BigDecimal.valueOf(
                    merchantTransactions.get(merchantTransactions.size() - 1).getAmount()
            );

            detectedSubscriptions.add(new TransactionsResponse(
                    merchantName,
                    amount,
                    billingCycle,
                    nextBillingDate
            ));
        }

        return detectedSubscriptions;
    }

}
